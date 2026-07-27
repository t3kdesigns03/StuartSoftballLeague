import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isoWeekId } from "@/lib/week";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/week — roll over to a new week.
 *
 * Nothing is deleted. Existing check-ins keep their old week_id, so past weeks
 * stay in the database as history, and the permanent roster is untouched.
 *
 * This used to be a direct table update from the browser, which meant anyone
 * holding the publishable key could reset the league's week. It is admin-only now.
 */
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Suffix with a timestamp so a second reset in the same calendar week still
  // produces a distinct marker.
  const next = `${isoWeekId()}-${Date.now().toString(36)}`;

  const { error } = await supabaseAdmin()
    .from("league_state")
    .update({ current_week_id: next })
    .eq("id", 1);

  if (error) {
    console.error("[ssl26] week roll failed", error);
    return NextResponse.json(
      { error: "Could not start a new week" },
      { status: 500 },
    );
  }

  return NextResponse.json({ week_id: next });
}
