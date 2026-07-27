import { GenderBadge } from "@/components/GenderBadge";
import { countByGender } from "@/lib/teams";
import type { Team } from "@/lib/types";

const THEME = {
  green: {
    border: "border-neon-cyan/35",
    shell: "shadow-[0_0_60px_-24px_rgba(0,240,255,0.95)]",
    title: "text-neon-cyan drop-shadow-[0_0_16px_rgba(0,240,255,0.65)]",
    chip: "bg-neon-cyan/12 text-neon-cyan border-neon-cyan/45 shadow-[0_0_20px_-6px_rgba(0,240,255,0.9)]",
    row: "border-white/8 bg-white/[0.03]",
    captainRow:
      "border-neon-cyan/55 bg-neon-cyan/10 shadow-[0_0_28px_-10px_rgba(0,240,255,0.95)]",
    wash: "radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.16) 0%, transparent 62%)",
  },
  yellow: {
    border: "border-neon-magenta/35",
    shell: "shadow-[0_0_60px_-24px_rgba(255,0,170,0.95)]",
    title: "text-neon-magenta drop-shadow-[0_0_16px_rgba(255,0,170,0.65)]",
    chip: "bg-neon-magenta/12 text-neon-magenta border-neon-magenta/45 shadow-[0_0_20px_-6px_rgba(255,0,170,0.9)]",
    row: "border-white/8 bg-white/[0.03]",
    captainRow:
      "border-neon-magenta/55 bg-neon-magenta/10 shadow-[0_0_28px_-10px_rgba(255,0,170,0.95)]",
    wash: "radial-gradient(ellipse at 50% 0%, rgba(255,0,170,0.16) 0%, transparent 62%)",
  },
} as const;

export function TeamCard({ team }: { team: Team }) {
  const theme = THEME[team.color];
  const { guys, girls } = countByGender(team.players);

  return (
    <section
      className={`glass-panel rounded-blob animate-pop-in relative overflow-hidden border-2 p-5 sm:p-6 ${theme.border} ${theme.shell}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: theme.wash }}
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            className={`text-xl font-black tracking-wide uppercase sm:text-2xl ${theme.title}`}
          >
            {team.name}
          </h3>
          <span
            className={`rounded-full border px-3 py-1 text-sm font-black tabular-nums ${theme.chip}`}
          >
            {team.players.length}
          </span>
        </div>

        <p className="text-starlight-faint mt-1.5 text-xs font-bold tracking-[0.16em] uppercase">
          {guys} {guys === 1 ? "guy" : "guys"} · {girls}{" "}
          {girls === 1 ? "girl" : "girls"}
        </p>

        <ul className="mt-5 space-y-2.5">
          {team.players.map((player) => {
            const isCaptain = player.id === team.captain.id;
            return (
              <li
                key={player.id}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-colors duration-300 ${
                  isCaptain ? theme.captainRow : theme.row
                }`}
              >
                <span className="text-starlight min-w-0 flex-1 truncate font-bold">
                  {player.name}
                </span>
                {isCaptain && (
                  <span
                    className="shrink-0 text-sm drop-shadow-[0_0_10px_rgba(240,255,0,0.95)]"
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
    </section>
  );
}
