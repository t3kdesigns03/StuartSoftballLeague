import { GenderBadge } from "@/components/GenderBadge";
import { countByGender } from "@/lib/teams";
import type { Team } from "@/lib/types";

const THEME = {
  green: {
    card: "border-field-200 bg-field-50/60",
    title: "text-field-900",
    chip: "bg-field-600 text-white",
    row: "border-field-100 bg-white",
    captainRow: "border-field-300 bg-field-100/70",
  },
  yellow: {
    card: "border-sun-200 bg-sun-50/60",
    title: "text-sun-700",
    chip: "bg-sun-500 text-white",
    row: "border-sun-100 bg-white",
    captainRow: "border-sun-300 bg-sun-100/70",
  },
} as const;

export function TeamCard({ team }: { team: Team }) {
  const theme = THEME[team.color];
  const { guys, girls } = countByGender(team.players);

  return (
    <section className={`animate-pop-in rounded-3xl border-2 p-5 shadow-lg shadow-black/5 sm:p-6 ${theme.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={`text-xl font-extrabold sm:text-2xl ${theme.title}`}>
          {team.name}
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${theme.chip}`}
        >
          {team.players.length}
        </span>
      </div>
      <p className="text-field-700/70 mt-1 text-sm font-medium">
        {guys} {guys === 1 ? "guy" : "guys"} · {girls}{" "}
        {girls === 1 ? "girl" : "girls"}
      </p>

      <ul className="mt-4 space-y-2">
        {team.players.map((player) => {
          const isCaptain = player.id === team.captain.id;
          return (
            <li
              key={player.id}
              className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${
                isCaptain ? theme.captainRow : theme.row
              }`}
            >
              <span className="text-field-900 min-w-0 flex-1 truncate font-semibold">
                {player.name}
              </span>
              {isCaptain && (
                <span className="shrink-0 text-sm font-bold" title="Captain">
                  <span aria-hidden="true">⭐</span>
                  <span className="sr-only">Captain</span>
                </span>
              )}
              <GenderBadge gender={player.gender} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
