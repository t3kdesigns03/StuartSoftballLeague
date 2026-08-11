/**
 * Check-in cutoff.
 *
 * Tuesday 6:00 PM, league local time. Check-in stays open until then; the teams
 * are decided at 6 PM. Games follow at 6:30.
 *
 * This is a *soft* deadline. Nothing is locked when it passes — the admin can
 * still draw and publish whenever they like, and stragglers can still check in.
 * It only drives what the UI emphasises, so a wrong clock or an odd timezone
 * can never leave you unable to post teams on game night.
 */

export const LEAGUE_TIMEZONE = "America/Chicago";

export const CUTOFF_LABEL = "Tuesday 6 PM";
const CUTOFF_DAY = 2; // 2 = Tuesday
const CUTOFF_HOUR = 18; // 18:00 — 6 PM

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
 * name at 6:20 would change the lock seed and silently re-roll teams that had
 * already been decided.
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
