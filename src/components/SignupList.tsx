"use client";

import { GenderBadge } from "@/components/GenderBadge";
import { SoftballIcon } from "@/components/SoftballIcon";
import {
  buildSignupEntries,
  countPlayers,
  hasRealName,
  type SignupEntry,
} from "@/lib/signupEntries";
import { countByGender } from "@/lib/teams";
import type { Signup } from "@/lib/types";

type Props = {
  signups: Signup[];
  loading: boolean;
  error: string | null;
};

const ROW_TONE = {
  guy: "border-neon-cyan/18 hover:border-neon-cyan/45 hover:shadow-[0_0_26px_-10px_rgba(0,240,255,0.9)]",
  girl: "border-neon-magenta/18 hover:border-neon-magenta/45 hover:shadow-[0_0_26px_-10px_rgba(255,0,170,0.9)]",
} as const;

/** One player row. `n` is null for rows inside a pair, which share a bracket. */
function PlayerRow({ player, n }: { player: Signup; n: number | null }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-3.5 py-2.5 transition-all duration-300 hover:bg-white/[0.06] ${ROW_TONE[player.gender] ?? ROW_TONE.guy}`}
    >
      <span className="text-starlight-faint w-5 shrink-0 text-xs font-black tabular-nums">
        {n === null ? "" : String(n).padStart(2, "0")}
      </span>
      <span className="text-starlight min-w-0 flex-1 truncate font-bold">
        {player.name}
      </span>
      <GenderBadge gender={player.gender} />
    </div>
  );
}

export function SignupList({ signups, loading, error }: Props) {
  // Anything without a real name is dropped before it can become a blank row.
  const real = signups.filter(hasRealName);
  const entries = buildSignupEntries(real);
  const { guys, girls } = countByGender(real);
  const total = countPlayers(entries);

  // Running player number, so positions never skip.
  let counter = 0;
  const nextNumber = () => ++counter;

  return (
    <section
      aria-labelledby="signups-heading"
      className="glass-panel glass-panel-hover rounded-blob p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="signups-heading"
          className="text-starlight text-xl font-extrabold tracking-wide uppercase sm:text-2xl"
        >
          This week&rsquo;s{" "}
          <span className="text-neon-cyan drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">
            signups
          </span>
        </h2>
        <span className="text-neon-cyan border-neon-cyan/35 rounded-full border bg-black/40 px-3 py-1 text-sm font-black tabular-nums shadow-[0_0_20px_-6px_rgba(0,240,255,0.9)]">
          {total}
        </span>
      </div>

      {total > 0 && (
        <p className="text-starlight-faint mt-1.5 text-xs font-bold tracking-[0.16em] uppercase">
          <span className="text-neon-cyan/90">{guys}</span>{" "}
          {guys === 1 ? "guy" : "guys"} ·{" "}
          <span className="text-neon-magenta/90">{girls}</span>{" "}
          {girls === 1 ? "girl" : "girls"}
        </p>
      )}

      <div className="mt-5">
        {error ? (
          <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </p>
        ) : loading ? (
          <ul className="space-y-2.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-12 animate-pulse rounded-xl border border-white/5 bg-white/[0.04]"
              />
            ))}
          </ul>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/12 bg-black/20 px-4 py-9 text-center">
            <div className="relative mx-auto mb-3 w-fit">
              <div
                className="absolute inset-0 -z-10 scale-[2.2] rounded-full blur-xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(240,255,0,0.35) 0%, transparent 68%)",
                  animation: "nebula-breathe 5s ease-in-out infinite",
                }}
              />
              <SoftballIcon className="animate-float-slow h-9 w-9 opacity-90" />
            </div>
            <p className="text-starlight-dim text-sm font-bold">
              No one yet — be the first on the field!
            </p>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {entries.map((entry) => (
              <li key={entry.player.id} className="animate-pop-in">
                <EntryRow entry={entry} nextNumber={nextNumber} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function EntryRow({
  entry,
  nextNumber,
}: {
  entry: SignupEntry;
  nextNumber: () => number;
}) {
  if (entry.kind === "solo") {
    return <PlayerRow player={entry.player} n={nextNumber()} />;
  }

  if (entry.kind === "pair") {
    const a = nextNumber();
    const b = nextNumber();
    return (
      // Confirmed couple: one bracket around both, so it reads as a unit.
      <div className="border-neon-purple/30 bg-neon-purple/[0.05] relative rounded-2xl border-2 p-2 shadow-[0_0_28px_-14px_rgba(176,0,255,0.9)]">
        <div className="space-y-1.5">
          <PlayerRow player={entry.player} n={a} />

          {/* Heart link between the two */}
          <div className="flex items-center gap-2 px-2" aria-hidden="true">
            <span className="bg-neon-purple/30 h-px flex-1" />
            <span className="text-neon-purple animate-float-slow text-xs drop-shadow-[0_0_10px_rgba(176,0,255,0.95)]">
              🥎💜
            </span>
            <span className="bg-neon-purple/30 h-px flex-1" />
          </div>

          <PlayerRow player={entry.partner} n={b} />
        </div>

        <p className="text-neon-purple/85 mt-2 px-1 text-center text-[0.6rem] font-black tracking-[0.2em] uppercase">
          Other halves · same team
        </p>
      </div>
    );
  }

  // Pending: named someone who hasn't confirmed. Nested child, no number —
  // they are not a player yet, so they must not look like one.
  return (
    <div>
      <PlayerRow player={entry.player} n={nextNumber()} />
      <div className="mt-1 flex items-stretch gap-2 pl-4">
        <span
          aria-hidden="true"
          className="border-neon-purple/30 mt-0 w-3 shrink-0 rounded-bl-lg border-b-2 border-l-2"
          style={{ height: "1.1rem" }}
        />
        <p className="border-neon-purple/20 bg-neon-purple/[0.04] text-starlight-dim flex-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-bold">
          <span aria-hidden="true" className="mr-1.5">
            💜
          </span>
          Waiting for{" "}
          <span className="text-neon-purple font-black">
            {entry.waitingFor}
          </span>{" "}
          to check in
        </p>
      </div>
    </div>
  );
}
