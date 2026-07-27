import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const isScore = (v: unknown): v is number | null =>
  v === null || (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 200);

/**
 * PATCH /api/admin/score — record the final score against a published draw.
 *
 * Entered by the admin after the game. Passing null for both clears the score,
 * which is how you undo a mis-tap at the field.
 */
export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let week_id: unknown;
  let score_a: unknown;
  let score_b: unknown;
  try {
    ({ week_id, score_a, score_b } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (typeof week_id !== "string" || !week_id) {
    return NextResponse.json({ error: "Missing week_id" }, { status: 400 });
  }
  if (!isScore(score_a) || !isScore(score_b)) {
    return NextResponse.json(
      { error: "Scores must be whole numbers between 0 and 200, or null" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin()
    .from("team_draws")
    .update({ score_a, score_b })
    .eq("week_id", week_id)
    .select("week_id, score_a, score_b")
    .single();

  if (error) {
    console.error("[ssl26] score update failed", error);
    return NextResponse.json(
      { error: "Could not save the score. Is the draw published?" },
      { status: 500 },
    );
  }

  return NextResponse.json({ draw: data });
}
