"use client";

import { GenderBadge } from "@/components/GenderBadge";
import type { PublishedTeam, TeamDraw } from "@/lib/types";

/**
 * The season so far: every published week, most recent first, in a quiet
 * collapsed list. Each row shows only team names and the final score; the
 * roster for that week is tucked into a dropdown so the section stays compact.
 *
 * The current week's live draw is shown in full at the top of the page, so it
 * is excluded here (via `excludeWeekId`) to avoid showing it twice.
 */
export function SeasonHistory({
  draws,
  excludeWeekId,
}: {
  draws: TeamDraw[];
  excludeWeekId?: string | null;
}) {
  const past = draws.filter((d) => d.week_id !== excludeWeekId);
  if (past.length === 0) return null;

  return (
    <section aria-labelledby="history-heading" className="mt-14">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="history-heading"
          className="text-starlight text-sm font-black tracking-[0.28em] uppercase"
        >
          Season so far
        </h2>
        <span className="text-starlight-faint text-[0.62rem] font-bold tracking-[0.2em] uppercase">
          {past.length} {past.length === 1 ? "week" : "weeks"}
        </span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {past.map((draw) => (
          <HistoryRow key={draw.week_id} draw={draw} />
        ))}
      </ul>
    </section>
  );
}

function HistoryRow({ draw }: { draw: TeamDraw }) {
  const [teamA, teamB] = draw.teams;
  const hasScore = draw.score_a !== null && draw.score_b !== null;
  const aWon = hasScore && (draw.score_a as number) > (draw.score_b as number);
  const bWon = hasScore && (draw.score_b as number) > (draw.score_a as number);
  const tie = hasScore && !aWon && !bWon;

  return (
    <li>
      <details className="glass-panel rounded-2xl group open:pb-1">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
          {/* Week label */}
          <div className="min-w-0 shrink-0">
            <p className="text-starlight text-xs font-black tracking-[0.14em] uppercase">
              {weekLabel(draw)}
            </p>
            <p className="text-starlight-faint text-[0.6rem] font-bold tracking-[0.14em] uppercase">
              {weekDate(draw)}
            </p>
          </div>

          {/* Scoreline — always visible */}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3">
            <span
              className={`text-neon-cyan min-w-0 flex-1 truncate text-right text-[0.7rem] font-black tracking-[0.1em] uppercase sm:text-xs ${
                hasScore && !aWon ? "opacity-60" : ""
              }`}
            >
              {teamA.name}
            </span>
            <span
              className={`shrink-0 rounded-lg px-2 py-0.5 text-sm font-black tabular-nums sm:text-base ${
                hasScore
                  ? "bg-white/[0.05] text-starlight"
                  : "text-starlight-faint/60"
              }`}
            >
              {hasScore ? `${draw.score_a}–${draw.score_b}` : "· – ·"}
            </span>
            <span
              className={`text-neon-magenta min-w-0 flex-1 truncate text-left text-[0.7rem] font-black tracking-[0.1em] uppercase sm:text-xs ${
                hasScore && !bWon ? "opacity-60" : ""
              }`}
            >
              {teamB.name}
            </span>
          </div>

          {/* State + chevron */}
          <div className="flex shrink-0 items-center gap-2">
            {!hasScore && (
              <span className="text-starlight-faint hidden text-[0.55rem] font-black tracking-[0.16em] uppercase sm:inline">
                pending
              </span>
            )}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="text-starlight-faint h-4 w-4 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </summary>

        {/* Roster dropdown */}
        <div className="border-t border-white/8 px-4 pt-3 pb-3">
          {tie && (
            <p className="text-neon-yellow mb-3 text-center text-[0.6rem] font-black tracking-[0.2em] uppercase">
              Tie game
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <RosterColumn team={teamA} accent="cyan" won={aWon} />
            <RosterColumn team={teamB} accent="magenta" won={bWon} />
          </div>
        </div>
      </details>
    </li>
  );
}

function RosterColumn({
  team,
  accent,
  won,
}: {
  team: PublishedTeam;
  accent: "cyan" | "magenta";
  won: boolean;
}) {
  const titleColor = accent === "cyan" ? "text-neon-cyan" : "text-neon-magenta";
  return (
    <div>
      <div className="flex items-center gap-2">
        <h3
          className={`min-w-0 flex-1 truncate text-xs font-black tracking-[0.12em] uppercase ${titleColor}`}
        >
          {team.name}
        </h3>
        {won && (
          <span className="text-neon-yellow text-[0.55rem] font-black tracking-[0.16em] uppercase">
            Won
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {team.players.map((player) => {
          const isCaptain = player.id === team.captain_id;
          return (
            <li
              key={player.id}
              className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1.5"
            >
              <span className="text-starlight min-w-0 flex-1 truncate text-sm font-bold">
                {player.name}
              </span>
              {isCaptain && (
                <span
                  className="shrink-0 text-xs drop-shadow-[0_0_10px_rgba(240,255,0,0.95)]"
                  title="Captain"
                >
                  <span aria-hidden="true">⭐</span>
                  <span className="sr-only">Captain</span>
                </span>
              )}
              <GenderBadge gender={player.gender} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** "Week 31" from a week_id like "2026-W31" or "2026-W31-lz4f9". */
function weekLabel(draw: TeamDraw): string {
  const match = draw.week_id.match(/-W(\d+)/);
  return match ? `Week ${Number(match[1])}` : draw.week_id;
}

/** The date the draw went live, for a light secondary label. */
function weekDate(draw: TeamDraw): string {
  const stamp = draw.published_at ?? draw.drawn_at;
  if (!stamp) return "";
  const ms = Date.parse(stamp);
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
