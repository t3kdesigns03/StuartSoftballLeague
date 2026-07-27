"use client";

import { useState } from "react";

import type { Gender } from "@/lib/types";

type Batter = { id: string; name: string; gender: Gender };

const DOT: Record<Gender, string> = {
  guy: "bg-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.9)]",
  girl: "bg-neon-magenta shadow-[0_0_10px_rgba(255,0,170,0.9)]",
};

/**
 * Suggested lineup, collapsible so it doesn't dominate the team card on a phone.
 *
 * League rule 11 wants the order to alternate guy/girl as far as the roster
 * allows; where the counts make that impossible the run is shown honestly
 * rather than hidden.
 */
export function BattingOrder({
  batters,
  accent,
}: {
  batters: Batter[];
  accent: "cyan" | "magenta";
}) {
  const [open, setOpen] = useState(false);
  if (batters.length === 0) return null;

  const perfect = batters.every(
    (b, i) => i === 0 || b.gender !== batters[i - 1].gender,
  );

  const ring =
    accent === "cyan"
      ? "border-neon-cyan/25 hover:border-neon-cyan/50 text-neon-cyan"
      : "border-neon-magenta/25 hover:border-neon-magenta/50 text-neon-magenta";

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-black/25 px-3.5 py-2.5 text-left transition-all duration-300 ${ring}`}
      >
        <span className="text-[0.68rem] font-black tracking-[0.18em] uppercase">
          Batting order
        </span>
        <span className="flex items-center gap-2">
          <span className="text-starlight-faint text-[0.62rem] font-bold tracking-[0.12em] uppercase">
            {perfect ? "Alternating" : "Best fit"}
          </span>
          <span
            aria-hidden="true"
            className={`text-xs transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </span>
      </button>

      {open && (
        <ol className="animate-pop-in mt-2.5 space-y-1.5">
          {batters.map((batter, index) => (
            <li
              key={batter.id}
              className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
            >
              <span className="text-starlight-faint w-5 shrink-0 text-xs font-black tabular-nums">
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${DOT[batter.gender]}`}
              />
              <span className="text-starlight min-w-0 flex-1 truncate text-sm font-bold">
                {batter.name}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
