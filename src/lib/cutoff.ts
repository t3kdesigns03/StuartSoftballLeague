/**
 * Check-in cutoff: Monday 6:00 PM, league local time.
 *
 * This is a *soft* deadline. Nothing is locked when it passes — the admin can
 * still draw and publish whenever they like, and stragglers can still check in.
 * It only drives what the UI emphasises, so a wrong clock or an odd timezone
 * can never leave you unable to post teams on game night.
 */

export const LEAGUE_TIMEZONE = "America/Chicago";
const CUTOFF_DAY = 1; // Monday
const CUTOFF_HOUR = 18; // 18:00

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
 * Minutes until the next Monday 18:00 in league time.
 * Negative once the cutoff has passed for the current game week.
 */
export function minutesToCutoff(now = new Date()): number {
  const { day, hour, minute } = leagueParts(now);
  const nowMin = day * 1440 + hour * 60 + minute;
  const cutMin = CUTOFF_DAY * 1440 + CUTOFF_HOUR * 60;

  // The game week runs Monday 18:00 -> next Monday 18:00. Tuesday through
  // Sunday are "after this week's cutoff", counting down to the next one.
  const delta = cutMin - nowMin;
  return delta >= 0 ? delta : delta + 7 * 1440;
}

/** True between Monday 18:00 and Tuesday's game — time to post the final draw. */
export function isPastCutoff(now = new Date()): boolean {
  const { day, hour } = leagueParts(now);
  if (day === CUTOFF_DAY) return hour >= CUTOFF_HOUR;
  return day === 2; // Tuesday — game day
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
