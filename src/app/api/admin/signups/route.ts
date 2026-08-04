import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/signups — drop one weekly check-in.
 *
 * A player who signed up and then backed out. This removes ONLY the row from
 * `signups`; the permanent `players` roster (name, gender, paid) is never
 * touched, and past weeks are untouched because we always scope by the exact
 * row (id) or by (player_id, week_id).
 *
 * Accepts either { signup_id } or { player_id, week_id }. Realtime on `signups`
 * carries the removal to the public page automatically.
 */
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let signup_id: unknown;
  let player_id: unknown;
  let week_id: unknown;
  try {
    ({ signup_id, player_id, week_id } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  let query = supabaseAdmin().from("signups").delete();

  if (typeof signup_id === "string" && signup_id) {
    query = query.eq("id", signup_id);
  } else if (
    typeof player_id === "string" &&
    player_id &&
    typeof week_id === "string" &&
    week_id
  ) {
    query = query.eq("player_id", player_id).eq("week_id", week_id);
  } else {
    return NextResponse.json(
      { error: "Expected { signup_id } or { player_id, week_id }" },
      { status: 400 },
    );
  }

  const { error } = await query;

  if (error) {
    console.error("[ssl26] signup delete failed", error);
    return NextResponse.json(
      { error: "Could not remove signup" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
