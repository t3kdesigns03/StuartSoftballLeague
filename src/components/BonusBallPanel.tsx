"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { UseBonusBall } from "@/hooks/useBonusBall";
import { BONUS_ENTRY_FEE } from "@/lib/types";
import type { Signup } from "@/lib/types";

/**
 * The main-page Bonus Ball spot — the feature's home, not a small add-on.
 *
 *   - feature off        -> renders nothing
 *   - on, not an entrant -> a mystery teaser (no total, no names) plus a
 *                           name box that reveals the pool for existing members
 *                           and lets roster players join
 *   - on, an entrant     -> the live reveal: running pool total and the list of
 *                           who's in, refreshed by the hook
 *
 * The reveal only ever shows what the server returned for a confirmed member;
 * this component never computes or displays a total for a non-entrant.
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

  // --- Non-entrant: mystery teaser + reveal / join --------------------------
  return (
    <section
      aria-label="Bonus Ball"
      className="rounded-blob relative mt-6 overflow-hidden border-2 border-neon-magenta/40 bg-gradient-to-br from-neon-magenta/[0.08] via-void-900/40 to-neon-yellow/[0.06] p-5 shadow-[0_0_40px_-18px_rgba(255,0,170,0.7)] sm:p-7"
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
        </div>
      </div>

      <RevealOrJoin bonus={bonus} signups={signups} />
    </section>
  );
}

/**
 * The non-member's way in. Reveal-first: type your name and we ask the server
 * (through the same membership-gated RPC) whether you're already in.
 *
 *   - already in  -> the pool opens instantly, no re-entry, no charge. This is
 *                    what lets a member on a fresh device / cleared storage see
 *                    the live "who's in" view again just by naming themselves.
 *   - on the roster but not in yet -> an explicit "Join for $5" step, so peeking
 *                    never joins you by accident.
 *   - not on the roster -> sign up for the week first.
 *
 * Reading membership never records an entry; only the explicit Join does.
 */
function RevealOrJoin({
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
  const [offer, setOffer] = useState<Signup | null>(null);

  // Roster matches for what they've typed — tap one to check in a single move.
  const matches = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 1) return [];
    return signups.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4);
  }, [name, signups]);

  function reset() {
    setProblem(null);
    setOffer(null);
  }

  // Step 1: are they already in? Reveal for members; otherwise decide if they
  // can join.
  async function see(target?: Signup) {
    reset();
    const candidate = (target?.name ?? name).trim();
    if (!candidate) {
      setProblem("empty");
      return;
    }

    setBusy(true);
    const result = await bonus.reveal(candidate);
    setBusy(false);

    if (result === "member") return; // parent flips to the live reveal
    if (result === "error") {
      setProblem("failed");
      return;
    }

    // Not in the pool yet — can they join? (needs a roster row for gender)
    const match =
      target ??
      signups.find((s) => s.name.toLowerCase() === candidate.toLowerCase()) ??
      (matches.length === 1 ? matches[0] : undefined);

    if (match) setOffer(match);
    else setProblem(matches.length > 1 ? "pick" : "notfound");
  }

  // Step 2: the deliberate, paid opt-in.
  async function join(target: Signup) {
    setBusy(true);
    const ok = await bonus.enter(target.name, target.gender);
    setBusy(false);
    if (!ok) {
      setOffer(null);
      setProblem("failed");
    }
    // success -> parent flips to the live reveal
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void see();
      }}
      className="relative z-10 mt-5 border-t border-white/10 pt-5"
    >
      <label
        htmlFor="bonus-join-name"
        className="text-neon-magenta text-[0.62rem] font-black tracking-[0.24em] uppercase"
      >
        In the pool? Enter your name to see who&rsquo;s in
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
            reset();
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
          {busy ? "Checking…" : "See who's in"}
        </button>
      </div>

      {/* Tap-to-select suggestions from this week's roster. */}
      {matches.length > 0 && !busy && !offer && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {matches.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void see(s)}
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
        Already in? You&rsquo;ll go straight to the pool — no second entry. New?
        Joining is ${BONUS_ENTRY_FEE}, one per person (cash to the commissioner;
        the app just tracks who&rsquo;s in).
      </p>

      {/* Explicit join step for a roster player who isn't in yet. */}
      {offer && (
        <div className="animate-pop-in mt-3 rounded-xl border-2 border-neon-magenta/45 bg-neon-magenta/[0.08] p-3.5">
          <p className="text-starlight text-sm font-bold">
            {offer.name}, you&rsquo;re not in the pool yet.
          </p>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => void join(offer)}
              className="shrink-0 rounded-xl px-4 py-3 text-sm font-black tracking-[0.12em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              style={{
                background: "linear-gradient(100deg, #ff00aa 0%, #f0ff00 100%)",
                boxShadow: "0 0 26px -8px rgba(255,0,170,0.9)",
              }}
            >
              {busy ? "Joining…" : `Join for $${BONUS_ENTRY_FEE}`}
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-starlight-dim rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-3 text-sm font-bold tracking-[0.1em] uppercase transition-all duration-300 hover:border-white/25"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
