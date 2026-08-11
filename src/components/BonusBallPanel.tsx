"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { UseBonusBall } from "@/hooks/useBonusBall";
import { BONUS_ENTRY_FEE } from "@/lib/types";
import type { Signup } from "@/lib/types";

/**
 * The main-page Bonus Ball spot — the feature's home.
 *
 * When the feature is on, the live total and the list of who's in are shown to
 * everyone. Members additionally get a "you're in" badge; non-members get a join
 * box below the pool. The feature flag still controls whether any of this shows.
 */
export function BonusBallPanel({
  bonus,
  signups,
}: {
  bonus: UseBonusBall;
  signups: Signup[];
}) {
  const { enabled, entered, pool } = bonus;

  if (!enabled) return null;

  const hasData = pool?.enabled === true;
  const dollars = hasData ? pool.total_cents / 100 : 0;
  const count = hasData ? pool.count : 0;
  const names = hasData ? pool.names : [];

  return (
    <section
      aria-label="Bonus Ball pool"
      className="rounded-blob relative mt-6 overflow-hidden border-2 border-neon-magenta/45 bg-gradient-to-br from-neon-magenta/[0.10] via-void-900/40 to-neon-yellow/[0.07] p-5 shadow-[0_0_44px_-18px_rgba(255,0,170,0.8)] sm:p-7"
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

      <div className="relative z-10">
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
          {entered ? (
            <span className="text-neon-magenta text-[0.62rem] font-black tracking-[0.22em] uppercase">
              🍦 You&rsquo;re in
            </span>
          ) : (
            <span className="text-neon-yellow text-[0.62rem] font-black tracking-[0.22em] uppercase drop-shadow-[0_0_10px_rgba(240,255,0,0.6)]">
              ${BONUS_ENTRY_FEE} · Beta
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-5">
          <Image
            src="/ssldrip.png"
            alt="Ice-cream bonus softball"
            width={426}
            height={386}
            className="animate-float-slow h-20 w-20 shrink-0 drop-shadow-[0_0_18px_rgba(255,0,170,0.6)] sm:h-24 sm:w-24"
          />
          <div className="min-w-0">
            <p className="text-starlight-faint text-[0.6rem] font-black tracking-[0.26em] uppercase">
              In the pot this week
            </p>
            {hasData ? (
              <>
                <p className="text-glow-title text-5xl font-black tabular-nums sm:text-6xl">
                  ${dollars}
                </p>
                <p className="text-starlight-dim mt-1 text-xs font-bold">
                  {count} {count === 1 ? "player" : "players"} in · $
                  {BONUS_ENTRY_FEE} each
                </p>
              </>
            ) : (
              <p className="text-starlight-dim mt-1 text-2xl font-black">
                Tallying the pool…
              </p>
            )}
          </div>
        </div>

        {/* Who's in — visible to everyone now. */}
        {hasData && names.length > 0 && (
          <div className="mt-5">
            <p className="text-starlight-faint text-[0.6rem] font-black tracking-[0.24em] uppercase">
              Who&rsquo;s in
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {names.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="rounded-full border border-neon-magenta/30 bg-neon-magenta/[0.08] px-3 py-1.5 text-xs font-bold text-starlight"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasData && count === 0 && (
          <p className="text-starlight-dim mt-4 text-sm font-semibold">
            Nobody&rsquo;s in yet —{" "}
            <span className="text-neon-magenta font-bold">
              be the first to drop $5 in. 🍦
            </span>
          </p>
        )}

        {/* Non-members get the join box. Members just see the pool. */}
        {!entered && <JoinBox bonus={bonus} signups={signups} />}
      </div>
    </section>
  );
}

/**
 * Join the pool with just your name. Anyone already checked in this week can opt
 * in here (the roster lookup supplies the gender the RPC needs). Reveal-first, so
 * a member who lost their local state simply gets re-recognised rather than
 * double-entered; a name that isn't on the roster is sent to sign up first.
 */
function JoinBox({
  bonus,
  signups,
}: {
  bonus: UseBonusBall;
  signups: Signup[];
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<
    null | "empty" | "notfound" | "pick" | "failed"
  >(null);

  const matches = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 1) return [];
    return signups.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4);
  }, [name, signups]);

  async function join(target?: Signup) {
    setProblem(null);
    const candidate = (target?.name ?? name).trim();
    if (!candidate) {
      setProblem("empty");
      return;
    }

    setBusy(true);
    // Already in? Just re-recognise them — no second entry.
    const revealed = await bonus.reveal(candidate);
    if (revealed === "member") {
      setBusy(false);
      return; // parent shows the "you're in" badge
    }
    if (revealed === "error") {
      setBusy(false);
      setProblem("failed");
      return;
    }

    // Joining needs a roster row (for the gender the RPC requires).
    const match =
      target ??
      signups.find((s) => s.name.toLowerCase() === candidate.toLowerCase()) ??
      (matches.length === 1 ? matches[0] : undefined);
    if (!match) {
      setBusy(false);
      setProblem(matches.length > 1 ? "pick" : "notfound");
      return;
    }

    const ok = await bonus.enter(match.name, match.gender);
    setBusy(false);
    if (!ok) setProblem("failed");
    // success -> parent flips to the "you're in" badge and the list updates
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void join();
      }}
      className="mt-5 border-t border-white/10 pt-5"
    >
      <label
        htmlFor="bonus-join-name"
        className="text-neon-magenta text-[0.62rem] font-black tracking-[0.24em] uppercase"
      >
        Not in yet? Add your name to join
      </label>

      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
        <input
          id="bonus-join-name"
          name="bonus-join-name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="go"
          maxLength={60}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (problem) setProblem(null);
          }}
          placeholder="Your name"
          className="text-starlight placeholder:text-starlight-faint/60 focus:border-neon-magenta/70 focus:shadow-[0_0_0_4px_rgba(255,0,170,0.14),0_0_28px_-8px_rgba(255,0,170,0.85)] w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3.5 text-base outline-none transition duration-300 sm:flex-1"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-xl px-5 py-3.5 text-base font-black tracking-[0.12em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: "linear-gradient(100deg, #ff00aa 0%, #f0ff00 100%)",
            boxShadow:
              "0 0 30px -8px rgba(255,0,170,0.9), 0 10px 26px -12px rgba(240,255,0,0.7)",
          }}
        >
          {busy ? "Joining…" : `Join · $${BONUS_ENTRY_FEE}`}
        </button>
      </div>

      {/* Tap-to-join suggestions from this week's roster. */}
      {matches.length > 0 && !busy && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {matches.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void join(s)}
              className="text-starlight-dim hover:border-neon-magenta/60 hover:text-neon-magenta rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-bold transition-all duration-300"
            >
              <span aria-hidden="true" className="mr-1">
                🍦
              </span>
              {s.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-starlight-faint mt-2.5 text-[0.7rem] leading-relaxed">
        ${BONUS_ENTRY_FEE}, one entry per person (cash to the commissioner; the
        app just tracks who&rsquo;s in).
      </p>

      {problem === "empty" && (
        <p role="alert" className="text-starlight-dim mt-2.5 text-xs font-semibold">
          Enter your name first.
        </p>
      )}

      {problem === "pick" && (
        <p role="alert" className="text-starlight-dim mt-2.5 text-xs font-semibold">
          More than one match — tap your name above.
        </p>
      )}

      {problem === "notfound" && (
        <p
          role="alert"
          className="mt-2.5 rounded-xl border border-neon-yellow/35 bg-neon-yellow/[0.07] px-3.5 py-2.5 text-xs font-semibold text-neon-yellow"
        >
          We don&rsquo;t see that name on this week&rsquo;s roster yet.{" "}
          <a
            href="#signup"
            className="underline decoration-neon-yellow/60 underline-offset-2 hover:decoration-neon-yellow"
          >
            Sign up for the week
          </a>{" "}
          first, then come back.
        </p>
      )}

      {problem === "failed" && (
        <p
          role="alert"
          className="mt-2.5 rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-300"
        >
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
