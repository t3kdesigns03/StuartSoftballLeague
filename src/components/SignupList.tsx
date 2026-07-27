"use client";

import { GenderBadge } from "@/components/GenderBadge";
import { SoftballIcon } from "@/components/SoftballIcon";
import { countByGender } from "@/lib/teams";
import type { Signup } from "@/lib/types";

type Props = {
  signups: Signup[];
  loading: boolean;
  error: string | null;
};

export function SignupList({ signups, loading, error }: Props) {
  const { guys, girls } = countByGender(signups);

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
          {signups.length}
        </span>
      </div>

      {signups.length > 0 && (
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
        ) : signups.length === 0 ? (
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
            {signups.map((signup, index) => (
              <li
                key={signup.id}
                className={`animate-pop-in group flex items-center gap-3 rounded-xl border bg-white/[0.03] px-3.5 py-2.5 transition-all duration-300 hover:bg-white/[0.06] ${
                  signup.gender === "guy"
                    ? "border-neon-cyan/18 hover:border-neon-cyan/45 hover:shadow-[0_0_26px_-10px_rgba(0,240,255,0.9)]"
                    : "border-neon-magenta/18 hover:border-neon-magenta/45 hover:shadow-[0_0_26px_-10px_rgba(255,0,170,0.9)]"
                }`}
              >
                <span className="text-starlight-faint w-5 shrink-0 text-xs font-black tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-starlight min-w-0 flex-1 truncate font-bold">
                  {signup.name}
                </span>
                <GenderBadge gender={signup.gender} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
