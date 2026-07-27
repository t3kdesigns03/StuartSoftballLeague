import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Player } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/admin/players — the full roster with payment status. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();

  const [{ data: players, error }, { data: checkIns, error: checkInError }] =
    await Promise.all([
      db
        .from("players")
        .select("id, name, gender, paid, paid_at, created_at")
        .order("name", { ascending: true }),
      db.from("signups").select("player_id, week_id"),
    ]);

  if (error || checkInError) {
    console.error("[ssl26] roster read failed", error ?? checkInError);
    return NextResponse.json({ error: "Could not load roster" }, { status: 500 });
  }

  // How many distinct weeks each player has turned up for.
  const weeks = new Map<string, Set<string>>();
  for (const row of checkIns ?? []) {
    const set = weeks.get(row.player_id) ?? new Set<string>();
    set.add(row.week_id);
    weeks.set(row.player_id, set);
  }

  const roster: Player[] = (players ?? []).map((p) => ({
    ...p,
    weeks_played: weeks.get(p.id)?.size ?? 0,
  }));

  return NextResponse.json({ players: roster });
}

/** PATCH /api/admin/players — mark one player paid or unpaid. */
export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id: unknown;
  let paid: unknown;
  try {
    ({ id, paid } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (typeof id !== "string" || typeof paid !== "boolean") {
    return NextResponse.json(
      { error: "Expected { id: string, paid: boolean }" },
      { status: 400 },
    );
  }

  // paid_at is maintained by a database trigger, not here.
  const { data, error } = await supabaseAdmin()
    .from("players")
    .update({ paid })
    .eq("id", id)
    .select("id, name, gender, paid, paid_at, created_at")
    .single();

  if (error) {
    console.error("[ssl26] paid toggle failed", error);
    return NextResponse.json({ error: "Could not update player" }, { status: 500 });
  }

  return NextResponse.json({ player: data });
}
