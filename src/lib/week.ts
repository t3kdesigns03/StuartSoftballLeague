import { supabase } from "@/lib/supabase";

const STATE_ROW_ID = 1;

/**
 * A human-readable week marker, e.g. "2026-W31".
 * Used as the default when league_state has never been set.
 *
 * Safe to import from both server and client code — no Supabase calls.
 */
export function isoWeekId(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  // ISO weeks run Monday-Sunday; shift to the Thursday of this week.
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Read the week_id that check-ins should currently be recorded against. */
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
 * Roll over to a new week. Goes through the admin route rather than writing to
 * the table directly, because the browser is no longer permitted to change it.
 */
export async function startNewWeek(): Promise<string> {
  const response = await fetch("/api/admin/week", { method: "POST" });
  if (!response.ok) {
    throw new Error(`Could not start a new week (${response.status})`);
  }
  const { week_id } = (await response.json()) as { week_id: string };
  return week_id;
}
