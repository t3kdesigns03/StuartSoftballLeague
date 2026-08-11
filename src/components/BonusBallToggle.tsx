"use client";

import Image from "next/image";

import { BONUS_ENTRY_FEE } from "@/lib/types";

type Props = {
  /** Whether the visitor has ticked the box to enter with this check-in. */
  selected: boolean;
  onChange: (next: boolean) => void;
  /** True once the server confirms they are already in this week's pool. */
  entered: boolean;
};

/**
 * The Bonus Ball opt-in, shown on the signup form only while the feature is on.
 *
 * Deliberately loud: full-width candy-lit card carrying the ice-cream softball
 * so it can't be mistaken for the quieter partner checkbox above it. Leans into
 * mystery rather than spelling out the payout — curiosity is the hook.
 *
 * Once someone is in the pool it stops being a toggle and becomes a little
 * "you're in" badge, so re-checking in can't imply a second $5.
 */
export function BonusBallToggle({ selected, onChange, entered }: Props) {
  if (entered) {
    return (
      <div
        id="bonus-entry"
        className="rounded-2xl border-2 border-neon-magenta/55 bg-gradient-to-br from-neon-magenta/[0.12] to-neon-yellow/[0.08] px-4 py-3.5 shadow-[0_0_30px_-10px_rgba(255,0,170,0.85)]"
      >
        <div className="flex items-center gap-3">
          <Image
            src="/ssldrip.png"
            alt=""
            aria-hidden="true"
            width={426}
            height={386}
            className="h-11 w-11 shrink-0 drop-shadow-[0_0_10px_rgba(255,0,170,0.6)]"
          />
          <div className="min-w-0">
            <p className="text-neon-yellow text-sm font-black tracking-wide uppercase drop-shadow-[0_0_10px_rgba(240,255,0,0.6)]">
              You&rsquo;re in the Bonus Ball 🍦
            </p>
            <p className="text-starlight-dim mt-0.5 text-xs font-semibold">
              Your ${BONUS_ENTRY_FEE} is in this week&rsquo;s pool. Scroll up to
              watch it grow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      id="bonus-entry"
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Enter the $${BONUS_ENTRY_FEE} Bonus Ball pool`}
      onClick={() => onChange(!selected)}
      className={`group relative w-full overflow-hidden rounded-2xl border-2 px-4 py-4 text-left transition-all duration-300 ${
        selected
          ? "border-neon-magenta bg-gradient-to-br from-neon-magenta/[0.18] to-neon-yellow/[0.10] shadow-[0_0_34px_-8px_rgba(255,0,170,0.95)]"
          : "border-neon-magenta/35 bg-neon-magenta/[0.05] hover:border-neon-magenta/70 hover:bg-neon-magenta/[0.09] hover:shadow-[0_0_30px_-12px_rgba(255,0,170,0.8)]"
      }`}
    >
      {/* Sprinkle sheen sweeping across on hover/selected */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ${
          selected ? "opacity-100" : "group-hover:opacity-70"
        }`}
        style={{
          background:
            "linear-gradient(100deg, transparent 25%, rgba(255,255,255,0.35) 50%, transparent 75%)",
          backgroundSize: "220% 100%",
          animation: selected ? "sweep 1.6s linear infinite" : undefined,
        }}
      />

      <div className="relative z-10 flex items-center gap-3.5">
        <div className="relative shrink-0">
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 scale-150 rounded-full blur-lg"
            style={{
              background:
                "radial-gradient(circle, rgba(255,0,170,0.5) 0%, rgba(240,255,0,0.25) 55%, transparent 75%)",
            }}
          />
          <Image
            src="/ssldrip.png"
            alt="Ice-cream bonus softball"
            width={426}
            height={386}
            className={`h-14 w-14 transition-transform duration-500 ${
              selected ? "rotate-[8deg] scale-105" : "group-hover:rotate-6"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-neon-yellow text-sm font-black tracking-[0.12em] uppercase drop-shadow-[0_0_10px_rgba(240,255,0,0.6)]">
              Bonus Ball
            </span>
            <span className="rounded-full border border-neon-magenta/50 bg-neon-magenta/15 px-2 py-0.5 text-[0.6rem] font-black tracking-wider text-neon-magenta uppercase">
              ${BONUS_ENTRY_FEE} · optional
            </span>
          </div>
          <p className="text-starlight-dim mt-1 text-xs font-semibold">
            {selected ? (
              <span className="text-neon-magenta font-bold">
                You&rsquo;re in — add your $5 and unlock the pool 👀
              </span>
            ) : (
              <>Tap to join the mystery pool. Who&rsquo;s in? How big? 🍦✨</>
            )}
          </p>
        </div>

        {/* Checkbox pip */}
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-black transition-all duration-300 ${
            selected
              ? "border-neon-magenta bg-neon-magenta text-white"
              : "border-white/25 group-hover:border-neon-magenta/60"
          }`}
        >
          {selected ? "✓" : ""}
        </span>
      </div>
    </button>
  );
}
