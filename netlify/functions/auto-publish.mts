import { createClient } from "@supabase/supabase-js";

import { LEAGUE_TIMEZONE } from "../../src/lib/cutoff";
import { generateTeams, hashSeed, seededRand } from "../../src/lib/teams";
import { pickTeamNames } from "../../src/lib/teamNames";
import type { Gender } from "../../src/lib/types";

/**
 * Auto-publish the weekly draw just after Tuesday noon, league time.
 *
 * Why this exists: the public page already *locks* at noon and every visitor
 * computes the same teams from a seeded draw, so people can glance at lunch and
 * know. But that lock lives only in the browser — nothing is written down. This
 * function persists the same draw to `team_draws` so it becomes real history,
 * scores have something to attach to, and the teams survive even if the roster
 * changes later.
 *
 * Guarantees:
 *  - **Never overrides a manual publish.** If the commissioner already pressed
 *    Publish, this does nothing.
 *  - **Idempotent.** Running twice in the same week changes nothing.
 *  - **Matches the browser exactly** — same seed, same canonical ordering, same
 *    frozen roster, so the persisted teams are the ones people already read.
 *
 * Scheduling: cron has no timezone, and Iowa moves between CDT (UTC-5) and CST
 * (UTC-6). We fire at both 17:05 and 18:05 UTC on Tuesdays and let the function
 * decide whether it is actually just past noon locally. One of the two is
 * always right; the other exits immediately.
 */
// TEMPORARY FNL: this week is a rained-out reschedule to Friday Night Lights,
// but this cron is deliberately left Tuesday-only and its noon guard unchanged
// — do NOT retarget it to Friday. For this one week the commissioner will
// manually Generate + Publish teams after the Friday 2 PM lock. The normal
// Tuesday auto-publish path resumes automatically once FRIDAY_NIGHT_LIGHTS is
// flipped back off in src/lib/cutoff.ts; nothing here needs to change to revert.
export const config = {
  schedule: "5 17,18 * * 2",
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

/** Wall-clock hour in the league's timezone. */
function leagueHour(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  return Number(parts.find((p) => p.type === "hour")?.value ?? -1) % 24;
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

  // Only the run that lands in the noon hour locally should do anything.
  const hour = leagueHour(now);
  if (hour !== 12) {
    return new Response(
      JSON.stringify({ skipped: `local hour is ${hour}, not 12` }),
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
  // past noon, so `now` is effectively the cutoff instant.
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
  cutoff.setUTCMinutes(0, 0, 0); // top of the noon hour, locally

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
  // so the dugouts we persist are the ones people already read at lunch.
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
