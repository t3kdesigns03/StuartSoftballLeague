import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { PublishedTeam } from "@/lib/types";

export const dynamic = "force-dynamic";

function looksLikeTeam(value: unknown): value is PublishedTeam {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.name === "string" &&
    (t.color === "green" || t.color === "yellow") &&
    typeof t.captain_id === "string" &&
    Array.isArray(t.players) &&
    t.players.every(
      (p) =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as Record<string, unknown>).id === "string" &&
        typeof (p as Record<string, unknown>).name === "string",
    )
  );
}

/**
 * POST /api/admin/teams — publish a draw as this week's final say.
 *
 * Upserts on week_id, so re-drawing and publishing again replaces the previous
 * post rather than stacking up. The public page picks it up over realtime.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let week_id: unknown;
  let teams: unknown;
  try {
    ({ week_id, teams } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (typeof week_id !== "string" || !week_id) {
    return NextResponse.json({ error: "Missing week_id" }, { status: 400 });
  }
  if (!Array.isArray(teams) || teams.length !== 2 || !teams.every(looksLikeTeam)) {
    return NextResponse.json(
      { error: "Expected exactly two well-formed teams" },
      { status: 400 },
    );
  }

  // published_at is maintained by a database trigger.
  const { data, error } = await supabaseAdmin()
    .from("team_draws")
    .upsert(
      { week_id, teams, published: true, drawn_at: new Date().toISOString() },
      { onConflict: "week_id" },
    )
    .select("week_id, teams, drawn_at, published, published_at, score_a, score_b")
    .single();

  if (error) {
    console.error("[ssl26] publish failed", error);
    return NextResponse.json({ error: "Could not publish teams" }, { status: 500 });
  }

  return NextResponse.json({ draw: data });
}

/** DELETE /api/admin/teams?week_id=... — retract without losing the draw. */
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekId = new URL(request.url).searchParams.get("week_id");
  if (!weekId) {
    return NextResponse.json({ error: "Missing week_id" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("team_draws")
    .update({ published: false })
    .eq("week_id", weekId);

  if (error) {
    console.error("[ssl26] unpublish failed", error);
    return NextResponse.json({ error: "Could not retract teams" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
