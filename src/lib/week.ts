import { supabase } from "@/lib/supabase";

const STATE_ROW_ID = 1;

/**
 * A human-readable week marker, e.g. "2026-W31".
 * Used as the default when the league_state row has never been set.
 */
export function isoWeekId(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  // ISO weeks run Monday-Sunday; shift to the Thursday of this week.
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Read the week_id that signups should currently be written to. */
export async function getCurrentWeekId(): Promise<string> {
  const { data, error } = await supabase
    .from("league_state")
    .select("current_week_id")
    .eq("id", STATE_ROW_ID)
    .maybeSingle();

  if (error) throw error;
  return data?.current_week_id ?? isoWeekId();
}

/**
 * Roll over to a new week. Existing signups keep their old week_id, so past
 * weeks stay in the database as history — nothing is deleted.
 */
export async function startNewWeek(): Promise<string> {
  const base = isoWeekId();
  // Suffix with a timestamp so starting a second "new week" within the same
  // calendar week still produces a distinct marker.
  const next = `${base}-${Date.now().toString(36)}`;

  const { error } = await supabase
    .from("league_state")
    .update({ current_week_id: next })
    .eq("id", STATE_ROW_ID);

  if (error) throw error;
  return next;
}
