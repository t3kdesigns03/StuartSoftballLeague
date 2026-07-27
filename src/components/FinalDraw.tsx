"use client";

import { PublishedTeamCard } from "@/components/PublishedTeamCard";
import type { TeamDraw } from "@/lib/types";

/**
 * The published teams, shown on the public page. The final say.
 * Renders nothing until the admin has actually published a draw.
 */
export function FinalDraw({ draw }: { draw: TeamDraw | null }) {
  if (!draw?.published) return null;

  const hasScore = draw.score_a !== null && draw.score_b !== null;
  const aWon = hasScore && (draw.score_a as number) > (draw.score_b as number);
  const bWon = hasScore && (draw.score_b as number) > (draw.score_a as number);
  const tie = hasScore && !aWon && !bWon;

  return (
    <section aria-labelledby="final-draw-heading" className="animate-pop-in">
      <div className="text-center">
        <p className="text-neon-yellow text-[0.68rem] font-black tracking-[0.34em] uppercase drop-shadow-[0_0_12px_rgba(240,255,0,0.7)]">
          ★ Final Say ★
        </p>
        <h2
          id="final-draw-heading"
          className="text-glow-title mt-1.5 text-2xl font-black tracking-tight uppercase sm:text-3xl"
        >
          Tuesday&rsquo;s Teams
        </h2>
        {draw.published_at && (
          <p className="text-starlight-faint mt-1.5 text-[0.68rem] font-bold tracking-[0.2em] uppercase">
            Drawn{" "}
            {new Date(draw.published_at).toLocaleString(undefined, {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {hasScore && (
        <div className="glass-panel rounded-blob animate-pop-in mt-6 px-5 py-5">
          <p className="text-starlight-faint text-center text-[0.62rem] font-black tracking-[0.3em] uppercase">
            Final
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex-1 text-right">
              <p
                className={`text-neon-cyan text-xs font-black tracking-[0.12em] uppercase ${aWon ? "" : "opacity-60"}`}
              >
                {draw.teams[0].name}
              </p>
              <p
                className={`text-4xl font-black tabular-nums sm:text-5xl ${
                  aWon
                    ? "text-neon-cyan drop-shadow-[0_0_18px_rgba(0,240,255,0.7)]"
                    : "text-starlight-faint"
                }`}
              >
                {draw.score_a}
              </p>
            </div>

            <span className="text-starlight-faint text-xs font-black">–</span>

            <div className="flex-1 text-left">
              <p
                className={`text-neon-magenta text-xs font-black tracking-[0.12em] uppercase ${bWon ? "" : "opacity-60"}`}
              >
                {draw.teams[1].name}
              </p>
              <p
                className={`text-4xl font-black tabular-nums sm:text-5xl ${
                  bWon
                    ? "text-neon-magenta drop-shadow-[0_0_18px_rgba(255,0,170,0.7)]"
                    : "text-starlight-faint"
                }`}
              >
                {draw.score_b}
              </p>
            </div>
          </div>
          {tie && (
            <p className="text-neon-yellow mt-2 text-center text-xs font-black tracking-[0.2em] uppercase">
              Tie game
            </p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-2">
        <PublishedTeamCard team={draw.teams[0]} />
        <PublishedTeamCard team={draw.teams[1]} />
      </div>
    </section>
  );
}
