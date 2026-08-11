import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bonus — the commissioner's full view of the current pool.
 *
 * The public bonus_pool() RPC only reveals the total and names to entrants; the
 * admin reads the base tables directly with the secret key (bypassing RLS), so
 * it always sees the flag, the head count, the total and every name — no
 * membership gate.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data: state, error: stateError } = await db
    .from("league_state")
    .select("current_week_id, bonus_ball_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (stateError || !state) {
    console.error("[ssl26] bonus status read failed", stateError);
    return NextResponse.json({ error: "Could not read state" }, { status: 500 });
  }

  // Names for the open week only. Two plain selects joined in JS rather than a
  // PostgREST embed, so the read stays independent of the hand-written relation
  // typing. The browser never gets this list except through the gated RPC.
  const { data: entries, error: entriesError } = await db
    .from("bonus_entries")
    .select("player_id, created_at")
    .eq("week_id", state.current_week_id)
    .order("created_at", { ascending: true });

  if (entriesError) {
    console.error("[ssl26] bonus entries read failed", entriesError);
    return NextResponse.json({ error: "Could not read entries" }, { status: 500 });
  }

  const ids = (entries ?? []).map((e) => e.player_id);
  const nameById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: players, error: playersError } = await db
      .from("players")
      .select("id, name")
      .in("id", ids);
    if (playersError) {
      console.error("[ssl26] bonus name lookup failed", playersError);
      return NextResponse.json({ error: "Could not read entries" }, { status: 500 });
    }
    for (const p of players ?? []) nameById.set(p.id, p.name);
  }

  // Preserve entry order (already sorted by created_at above).
  const names = ids
    .map((id) => nameById.get(id))
    .filter((n): n is string => typeof n === "string");

  return NextResponse.json({
    enabled: state.bonus_ball_enabled,
    week_id: state.current_week_id,
    count: names.length,
    total_cents: names.length * 500,
    names,
  });
}

/** POST /api/admin/bonus — flip the feature on or off. Body: { enabled: boolean }. */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let enabled: unknown;
  try {
    ({ enabled } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "Expected { enabled: boolean }" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin()
    .from("league_state")
    .update({ bonus_ball_enabled: enabled })
    .eq("id", 1);

  if (error) {
    console.error("[ssl26] bonus flag toggle failed", error);
    return NextResponse.json(
      { error: "Could not update the flag" },
      { status: 500 },
    );
  }

  return NextResponse.json({ enabled });
}
