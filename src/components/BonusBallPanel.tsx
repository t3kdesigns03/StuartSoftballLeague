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
 *   - on, not an entrant -> a mystery teaser (no total, no names) plus an inline
 *                           name-only join for players already on this week's
 *                           roster
 *   - on, an entrant     -> the live reveal: running pool total and the list of
 *                           who's in, refreshed by the hook
 *
 * The reveal only ever shows what the server returned for a confirmed member;
 * this component never computes or displays a total for a non-entrant.
 *
 * Late-join gate: the RPC is unchanged, so "must be signed up first" is enforced
 * here against the week's roster. That lookup also hands us the player's gender,
 * so a late joiner opts in with their name alone — no second gender question.
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

  // --- Non-entrant: mystery teaser + name-only join --------------------------
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

      <JoinByName bonus={bonus} signups={signups} />
    </section>
  );
}

/**
 * Name-only opt-in for someone already checked in this week. Validates the name
 * against the roster (which also supplies the gender the RPC needs), so joining
 * is a couple of taps: type or tap your name, then Join. A name that isn't on
 * the roster is sent to sign up first rather than silently creating a stray
 * player row.
 */
function JoinByName({
  bonus,
  signups,
}: {
  bonus: UseBonusBall;
  signups: Signup[];
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [problem, setProblem] = useState<
    null | "empty" | "notfound" | "pick" | "failed"
  >(null);

  // Live roster matches for what they've typed — tap one to join in one move.
  const matches = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 1) return [];
    return signups.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4);
  }, [name, signups]);

  async function join(target?: Signup) {
    setProblem(null);
    const typed = name.trim();

    let match = target;
    if (!match) {
      if (!typed) {
        setProblem("empty");
        return;
      }
      match =
        signups.find((s) => s.name.toLowerCase() === typed.toLowerCase()) ??
        (matches.length === 1 ? matches[0] : undefined);
    }
    if (!match) {
      // Several roster names contain what they typed but none is exact — point
      // them at the tap-to-join chips rather than telling them they're not on
      // the roster (they might be).
      setProblem(matches.length > 1 ? "pick" : "notfound");
      return;
    }

    setStatus("saving");
    // Use the roster's canonical spelling + gender; the RPC is idempotent, so
    // if they were already in, this simply confirms and reveals the pool.
    const ok = await bonus.enter(match.name, match.gender);
    setStatus("idle");
    if (!ok) setProblem("failed");
    // On success the parent re-renders straight into the live reveal.
  }

  const saving = status === "saving";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void join();
      }}
      className="relative z-10 mt-5 border-t border-white/10 pt-5"
    >
      <label
        htmlFor="bonus-join-name"
        className="text-neon-magenta text-[0.62rem] font-black tracking-[0.24em] uppercase"
      >
        Already signed up? Join in seconds
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
          disabled={saving}
          className="shrink-0 rounded-xl px-5 py-3.5 text-base font-black tracking-[0.12em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: "linear-gradient(100deg, #ff00aa 0%, #f0ff00 100%)",
            boxShadow:
              "0 0 30px -8px rgba(255,0,170,0.9), 0 10px 26px -12px rgba(240,255,0,0.7)",
          }}
        >
          {saving ? "Joining…" : `Join · $${BONUS_ENTRY_FEE}`}
        </button>
      </div>

      {/* Tap-to-join suggestions from this week's roster. */}
      {matches.length > 0 && !saving && (
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

      {problem === "empty" && (
        <p role="alert" className="text-starlight-dim mt-2.5 text-xs font-semibold">
          Enter your name to join the pool.
        </p>
      )}

      {problem === "pick" && (
        <p role="alert" className="text-starlight-dim mt-2.5 text-xs font-semibold">
          More than one match — tap your name above to join.
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
          first, then come back to join.
        </p>
      )}

      {problem === "failed" && (
        <p
          role="alert"
          className="mt-2.5 rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-300"
        >
          Couldn&rsquo;t add you to the pool. Please try again.
        </p>
      )}
    </form>
  );
}
