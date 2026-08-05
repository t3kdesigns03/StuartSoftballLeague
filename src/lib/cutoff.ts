/**
 * Check-in cutoff.
 *
 * TEMPORARY FNL — this week we were rained out and are playing "Friday Night
 * Lights" instead of the usual Tuesday. The single flag below moves the whole
 * cutoff to Friday 2:00 PM. Flip it back to `false` (or delete the block) after
 * the Friday game to restore the standard Tuesday 12:00 PM behaviour — that is
 * the only change needed, everything else derives from it.
 *
 * Normally: Tuesday 12:00 PM, league local time — game day, a few hours before
 * first pitch at 6:30.
 *
 * This is a *soft* deadline. Nothing is locked when it passes — the admin can
 * still draw and publish whenever they like, and stragglers can still check in.
 * It only drives what the UI emphasises, so a wrong clock or an odd timezone
 * can never leave you unable to post teams on game night.
 */

/** TEMPORARY — set to false (or delete this block) to restore normal Tuesdays */
export const FRIDAY_NIGHT_LIGHTS = true;

export const LEAGUE_TIMEZONE = "America/Chicago";

// Everything below derives from the flag so the rest of the codebase stays
// clean and reverting is a one-line change.
export const CUTOFF_LABEL = FRIDAY_NIGHT_LIGHTS ? "Friday 2 PM" : "Tuesday 12 PM";
const CUTOFF_DAY = FRIDAY_NIGHT_LIGHTS ? 5 : 2; // 5 = Friday (FNL), 2 = Tuesday (normal)
const CUTOFF_HOUR = FRIDAY_NIGHT_LIGHTS ? 14 : 12; // 14:00 Friday (FNL), 12:00 noon (normal)

/** Wall-clock parts of `date` as seen in the league's timezone. */
function leagueParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    day: days.indexOf(parts.weekday as string),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/**
 * Minutes until the current game week's cutoff (`CUTOFF_DAY` at `CUTOFF_HOUR`)
 * in league time. Negative once the cutoff has passed for the current week.
 *
 * TEMPORARY FNL: with the flag on, the cutoff day/hour is Friday 2 PM; normally
 * it is Tuesday 12 PM. The arithmetic is identical either way.
 */
export function minutesToCutoff(now = new Date()): number {
  const { day, hour, minute } = leagueParts(now);
  const nowMin = day * 1440 + hour * 60 + minute;
  const cutMin = CUTOFF_DAY * 1440 + CUTOFF_HOUR * 60;

  // The week runs cutoff -> same weekday+time next week. Past this week's cutoff
  // we roll forward and count down to the next one.
  const delta = cutMin - nowMin;
  return delta >= 0 ? delta : delta + 7 * 1440;
}

/**
 * True from the cutoff (`CUTOFF_DAY` at `CUTOFF_HOUR`) until the end of game day
 * — time to post the draw. The following day onward is a fresh week counting
 * down to the next cutoff.
 *
 * TEMPORARY FNL: with the flag on this is Friday 2 PM; normally Tuesday 12 PM.
 */
export function isPastCutoff(now = new Date()): boolean {
  const { day, hour } = leagueParts(now);
  return day === CUTOFF_DAY && hour >= CUTOFF_HOUR;
}

/**
 * The instant the current game week's cutoff passed (or will pass).
 *
 * Used to freeze the locked roster: only check-ins recorded *before* this
 * moment count toward the official draw. Without it a straggler adding their
 * name at 3pm would change the lock seed and silently re-roll teams that
 * everyone already read at lunch.
 */
export function currentCutoffInstant(now = new Date()): Date {
  const mins = minutesToCutoff(now);
  const next = new Date(now.getTime() + mins * 60_000);
  // Zero the seconds so the boundary is exact.
  next.setSeconds(0, 0);
  return isPastCutoff(now)
    ? new Date(next.getTime() - 7 * 1440 * 60_000)
    : next;
}

/** "2d 4h", "3h 20m", "45m" — how long check-in stays open. */
export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "now";
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
