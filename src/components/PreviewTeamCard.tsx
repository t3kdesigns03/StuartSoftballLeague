"use client";

import { BattingOrder } from "@/components/BattingOrder";
import { GenderBadge } from "@/components/GenderBadge";
import { countByGender } from "@/lib/teams";
import type { Team } from "@/lib/types";

const THEME = {
  green: {
    border: "border-neon-cyan/30",
    glow: "shadow-[0_0_50px_-26px_rgba(0,240,255,0.9)]",
    title: "text-neon-cyan drop-shadow-[0_0_14px_rgba(0,240,255,0.6)]",
    chip: "bg-neon-cyan/12 text-neon-cyan border-neon-cyan/40",
    captain: "border-neon-cyan/50 bg-neon-cyan/10",
    accent: "cyan" as const,
  },
  yellow: {
    border: "border-neon-magenta/30",
    glow: "shadow-[0_0_50px_-26px_rgba(255,0,170,0.9)]",
    title: "text-neon-magenta drop-shadow-[0_0_14px_rgba(255,0,170,0.6)]",
    chip: "bg-neon-magenta/12 text-neon-magenta border-neon-magenta/40",
    captain: "border-neon-magenta/50 bg-neon-magenta/10",
    accent: "magenta" as const,
  },
} as const;

/**
 * One team in the live preview. Home/Away is called out hard — people were
 * picking a dugout and then having to move.
 */
export function PreviewTeamCard({
  team,
  side,
}: {
  team: Team;
  side: "HOME" | "AWAY";
}) {
  const theme = THEME[team.color];
  const { guys, girls } = countByGender(team.players);

  return (
    <section
      className={`glass-panel rounded-blob relative overflow-hidden border-2 p-4 sm:p-5 ${theme.border} ${theme.glow}`}
    >
      {/* Home / Away banner */}
      <div
        className={`-mx-4 -mt-4 mb-4 px-4 py-2 sm:-mx-5 sm:-mt-5 sm:mb-5 sm:px-5 ${
          side === "HOME"
            ? "bg-neon-yellow/15 border-neon-yellow/35"
            : "border-white/12 bg-white/[0.05]"
        } border-b`}
      >
        <p
          className={`text-center text-[0.7rem] font-black tracking-[0.34em] uppercase ${
            side === "HOME"
              ? "text-neon-yellow drop-shadow-[0_0_10px_rgba(240,255,0,0.65)]"
              : "text-starlight-dim"
          }`}
        >
          {side === "HOME" ? "🏠 Home dugout" : "🚌 Away dugout"}
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          className={`text-lg leading-tight font-black tracking-wide uppercase sm:text-xl ${theme.title}`}
        >
          {team.name}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-black tabular-nums ${theme.chip}`}
        >
          {team.players.length}
        </span>
      </div>

      <p className="text-starlight-faint mt-1 text-[0.68rem] font-bold tracking-[0.16em] uppercase">
        {guys} {guys === 1 ? "guy" : "guys"} · {girls}{" "}
        {girls === 1 ? "girl" : "girls"}
      </p>

      <ul className="mt-4 space-y-2">
        {team.players.map((player) => {
          const isCaptain = player.id === team.captain.id;
          return (
            <li
              key={player.id}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
                isCaptain
                  ? theme.captain
                  : "border-white/8 bg-white/[0.03]"
              }`}
            >
              <span className="text-starlight min-w-0 flex-1 truncate text-sm font-bold">
                {player.name}
              </span>
              {isCaptain && (
                <span
                  className="shrink-0 text-xs drop-shadow-[0_0_8px_rgba(240,255,0,0.9)]"
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

      <BattingOrder
        batters={team.battingOrder.map((p) => ({
          id: p.player_id,
          name: p.name,
          gender: p.gender,
        }))}
        accent={theme.accent}
      />
    </section>
  );
}
