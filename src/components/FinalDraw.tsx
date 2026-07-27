"use client";

import { PublishedTeamCard } from "@/components/PublishedTeamCard";
import type { TeamDraw } from "@/lib/types";

/**
 * The published teams, shown on the public page. The final say.
 * Renders nothing until the admin has actually published a draw.
 */
export function FinalDraw({ draw }: { draw: TeamDraw | null }) {
  if (!draw?.published) return null;

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

      <div className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-2">
        <PublishedTeamCard team={draw.teams[0]} />
        <PublishedTeamCard team={draw.teams[1]} />
      </div>
    </section>
  );
}
