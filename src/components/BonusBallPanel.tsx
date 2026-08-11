"use client";

import Image from "next/image";

import type { UseBonusBall } from "@/hooks/useBonusBall";
import { BONUS_ENTRY_FEE } from "@/lib/types";

/**
 * The main-page Bonus Ball spot.
 *
 *   - feature off        -> renders nothing
 *   - on, not an entrant -> a mystery teaser (no total, no names) with a CTA
 *                           that jumps to the opt-in on the signup form
 *   - on, an entrant     -> the live reveal: running pool total and the list of
 *                           who's in, refreshed by the hook
 *
 * The reveal only ever shows what the server returned for a confirmed member;
 * this component never computes or displays a total for a non-entrant.
 */
export function BonusBallPanel({ bonus }: { bonus: UseBonusBall }) {
  const { enabled, entered, pool } = bonus;

  if (!enabled) return null;

  // --- Entrant: the live pool ------------------------------------------------
  if (entered && pool?.enabled && pool.member) {
    const dollars = pool.total_cents / 100;
    return (
      <section
        aria-label="Bonus Ball pool"
        className="rounded-blob mt-6 border-2 border-neon-magenta/45 bg-gradient-to-br from-neon-magenta/[0.10] via-void-900/40 to-neon-yellow/[0.07] p-5 shadow-[0_0_44px_-18px_rgba(255,0,170,0.8)] sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-green opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon-green" />
            </span>
            <span className="text-neon-green text-[0.62rem] font-black tracking-[0.28em] uppercase">
              Live pool
            </span>
          </div>
          <span className="text-neon-magenta text-[0.62rem] font-black tracking-[0.22em] uppercase">
            🍦 You&rsquo;re in
          </span>
        </div>

        <div className="mt-4 flex items-center gap-5">
          <Image
            src="/ssldrip.png"
            alt=""
            aria-hidden="true"
            width={426}
            height={386}
            className="animate-float-slow h-20 w-20 shrink-0 drop-shadow-[0_0_18px_rgba(255,0,170,0.6)] sm:h-24 sm:w-24"
          />
          <div className="min-w-0">
            <p className="text-starlight-faint text-[0.6rem] font-black tracking-[0.26em] uppercase">
              In the pot this week
            </p>
            <p className="text-glow-title text-5xl font-black tabular-nums sm:text-6xl">
              ${dollars}
            </p>
            <p className="text-starlight-dim mt-1 text-xs font-bold">
              {pool.count} {pool.count === 1 ? "player" : "players"} in · $
              {BONUS_ENTRY_FEE} each
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-starlight-faint text-[0.6rem] font-black tracking-[0.24em] uppercase">
            Who&rsquo;s in
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {pool.names.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="rounded-full border border-neon-magenta/30 bg-neon-magenta/[0.08] px-3 py-1.5 text-xs font-bold text-starlight"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  // --- Non-entrant: the mystery teaser (no numbers, no names) ----------------
  return (
    <section
      aria-label="Bonus Ball"
      className="rounded-blob group relative mt-6 overflow-hidden border-2 border-neon-magenta/40 bg-gradient-to-br from-neon-magenta/[0.08] via-void-900/40 to-neon-yellow/[0.06] p-5 shadow-[0_0_40px_-18px_rgba(255,0,170,0.7)] sm:p-7"
    >
      {/* candy glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-10 h-52 w-52 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,0,170,0.4) 0%, rgba(240,255,0,0.2) 55%, transparent 75%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
        <div className="relative shrink-0">
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 scale-150 rounded-full blur-xl"
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
            className="animate-float-slow h-24 w-24 drop-shadow-[0_0_20px_rgba(255,0,170,0.65)] sm:h-28 sm:w-28"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-neon-yellow text-[0.62rem] font-black tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(240,255,0,0.6)]">
            New this week · Beta
          </p>
          <h2 className="text-glow-title mt-1 text-3xl font-black tracking-tight uppercase sm:text-4xl">
            The Bonus Ball
          </h2>
          <p className="text-starlight-dim mx-auto mt-2 max-w-md text-sm leading-relaxed sm:mx-0">
            A ${BONUS_ENTRY_FEE} mystery pool that resets every week. Drop in and
            you&rsquo;ll see the pot grow and who else is playing.{" "}
            <span className="text-neon-magenta font-bold">
              Stay out and it stays a secret. 👀
            </span>
          </p>

          <a
            href="#bonus-entry"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black tracking-[0.14em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(100deg, #ff00aa 0%, #f0ff00 100%)",
              boxShadow:
                "0 0 30px -8px rgba(255,0,170,0.9), 0 10px 26px -12px rgba(240,255,0,0.7)",
            }}
          >
            Unlock the pool 🍦
          </a>
        </div>
      </div>
    </section>
  );
}
