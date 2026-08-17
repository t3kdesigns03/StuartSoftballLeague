import { createClient } from "@supabase/supabase-js";

import { LEAGUE_TIMEZONE } from "../../src/lib/cutoff";
import { generateTeams, hashSeed, seededRand } from "../../src/lib/teams";
import { pickTeamNames } from "../../src/lib/teamNames";
import type { Gender } from "../../src/lib/types";

/**
 * Auto-publish the weekly draw just after Friday 7 PM, league time.
 *
 * Why this exists: the public page already *locks* at 7 PM and every visitor
 * computes the same teams from a seeded draw, so anyone loading the page sees
 * the same answer. But that lock lives only in the browser — nothing is written
 * down. This function persists the same draw to `team_draws` so it becomes real
 * history, scores have something to attach to, and the teams survive even if
 * the roster changes later.
 *
 * Guarantees:
 *  - **Never overrides a manual publish.** If the commissioner already pressed
 *    Publish, this does nothing.
 *  - **Idempotent.** Running twice in the same week changes nothing.
 *  - **Matches the browser exactly** — same seed, same canonical ordering, same
 *    frozen roster, so the persisted teams are the ones people already read.
 *
 * Scheduling: cron has no timezone, and Iowa moves between CDT (UTC-5) and CST
 * (UTC-6). Friday 19:00 local is 00:00 UTC Saturday under CDT but 01:00 UTC
 * Saturday under CST, so the schedule fires at both UTC hours on Saturday:
 *
 *   00:05 UTC Sat -> 19:05 CDT Fri  (summer: the real run)
 *   01:05 UTC Sat -> 19:05 CST Fri  (winter: the real run)
 *   01:05 UTC Sat -> 20:05 CDT Fri  (summer decoy — wrong hour)
 *   00:05 UTC Sat -> 18:05 CST Fri  (winter decoy — wrong hour)
 *
 * Both real firings land on Friday locally, so the guard below keys on the
 * local hour: exactly one firing a week lands in the 19:00 (7 PM) hour; the
 * other is an hour off and exits immediately. The weekday is checked too, so a
 * stray firing on any other local day can never publish.
 */
export const config = {
  schedule: "5 0,1 * * 6",
};

type SignupRow = {
  id: string;
  player_id: string;
  name: string;
  gender: Gender;
  created_at: string;
  week_id: string;
  partner_name: string | null;
};

/** Wall-clock weekday (0 = Sun) and hour in the league's timezone. */
function leagueDayHour(date: Date): { day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: days.indexOf(get("weekday") ?? ""),
    hour: Number(get("hour") ?? -1) % 24,
  };
}

function lockSeed(weekId: string, signups: readonly SignupRow[]): number {
  const ids = signups
    .map((s) => s.player_id)
    .sort()
    .join("|");
  return hashSeed(`${weekId}::${ids}`);
}

export default async function handler() {
  const now = new Date();

  // Only the run that lands in the 7 PM hour on Friday locally should do
  // anything. Both scheduled firings land on Friday, so the local hour is what
  // separates the real run from its DST decoy (18:00 under CST, 20:00 under CDT).
  const { day, hour } = leagueDayHour(now);
  if (day !== 5 || hour !== 19) {
    return new Response(
      JSON.stringify({
        skipped: `local time is day ${day} hour ${hour}, not Friday 19`,
      }),
      { status: 200 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error("[ssl26] auto-publish: missing Supabase env vars");
    return new Response(JSON.stringify({ error: "not configured" }), {
      status: 500,
    });
  }

  const db = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- which week is open? -------------------------------------------------
  const { data: state, error: stateError } = await db
    .from("league_state")
    .select("current_week_id")
    .eq("id", 1)
    .maybeSingle();

  if (stateError || !state?.current_week_id) {
    console.error("[ssl26] auto-publish: cannot read league_state", stateError);
    return new Response(JSON.stringify({ error: "no league state" }), {
      status: 500,
    });
  }
  const weekId = state.current_week_id as string;

  // --- already published? then this is not our business --------------------
  const { data: existing } = await db
    .from("team_draws")
    .select("week_id, published")
    .eq("week_id", weekId)
    .maybeSingle();

  if (existing?.published) {
    return new Response(
      JSON.stringify({ skipped: "already published", week_id: weekId }),
      { status: 200 },
    );
  }

  // --- the frozen roster ---------------------------------------------------
  // Everyone who checked in before this moment. The function runs a few minutes
  // past 7 PM, so `now` is effectively the cutoff instant.
  const { data: rows, error: signupError } = await db
    .from("signups_public")
    .select("*")
    .eq("week_id", weekId);

  if (signupError) {
    console.error("[ssl26] auto-publish: cannot read signups", signupError);
    return new Response(JSON.stringify({ error: "no signups" }), {
      status: 500,
    });
  }

  const cutoff = new Date(now);
  cutoff.setUTCMinutes(0, 0, 0); // top of the 7 PM hour, locally

  const all = (rows ?? []) as SignupRow[];
  const onTime = all.filter(
    (s) => new Date(s.created_at).getTime() < cutoff.getTime(),
  );
  const roster = (onTime.length >= 2 ? onTime : all).sort((a, b) =>
    a.player_id.localeCompare(b.player_id),
  );

  if (roster.length < 2) {
    return new Response(
      JSON.stringify({ skipped: "fewer than 2 checked in", week_id: weekId }),
      { status: 200 },
    );
  }

  // --- the same deterministic draw the browsers computed -------------------
  const rand = seededRand(lockSeed(weekId, roster));
  const teams = generateTeams(roster, rand);
  if (!teams) {
    return new Response(JSON.stringify({ error: "draw failed" }), {
      status: 500,
    });
  }

  const [nameA, nameB] = pickTeamNames(rand);
  teams[0].name = nameA;
  teams[1].name = nameB;
  // Drawn from the same seeded sequence, in the same order, as the browser —
  // so the dugouts we persist are the ones people already read.
  const homeIndex = rand() < 0.5 ? 0 : 1;

  const payload = teams.map((team, index) => ({
    name: team.name,
    color: team.color,
    captain_id: team.captain.player_id,
    players: team.players.map((p) => ({
      id: p.player_id,
      name: p.name,
      gender: p.gender,
    })),
    batting_order: team.battingOrder.map((p) => p.player_id),
    home: index === homeIndex,
  }));

  const { error: publishError } = await db.from("team_draws").upsert(
    {
      week_id: weekId,
      teams: payload,
      published: true,
      drawn_at: new Date().toISOString(),
    },
    { onConflict: "week_id" },
  );

  if (publishError) {
    console.error("[ssl26] auto-publish: write failed", publishError);
    return new Response(JSON.stringify({ error: "publish failed" }), {
      status: 500,
    });
  }

  console.log(
    `[ssl26] auto-published ${weekId}: ${nameA} vs ${nameB} (${roster.length} players)`,
  );
  return new Response(
    JSON.stringify({
      published: true,
      week_id: weekId,
      players: roster.length,
      teams: [nameA, nameB],
    }),
    { status: 200 },
  );
}
