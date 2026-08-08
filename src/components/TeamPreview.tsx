"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PreviewTeamCard } from "@/components/PreviewTeamCard";
import {
  CUTOFF_LABEL,
  currentCutoffInstant,
  formatCountdown,
  isPastCutoff,
  minutesToCutoff,
} from "@/lib/cutoff";
import { generateTeams, hashSeed, seededRand } from "@/lib/teams";
import { pickTeamNames } from "@/lib/teamNames";
import type { Signup, Team } from "@/lib/types";

/** Auto-reshuffle interval, jittered so it doesn't feel metronomic. */
const REFRESH_MIN_MS = 8_000;
const REFRESH_MAX_MS = 12_000;
const ROLL_COOLDOWN_MS = 12_000;

type Draw = {
  teams: [Team, Team];
  /** Which side is home. Part of the draw so it survives the lock. */
  homeIndex: 0 | 1;
};

/**
 * Build one draw. Pass a seeded RNG to make it reproducible.
 *
 * Everything random about a draw — rosters, captains, batting orders, team
 * names and home/away — comes from this single `rand`, so a given seed always
 * produces a byte-identical result.
 */
function buildDraw(
  signups: readonly Signup[],
  rand: () => number,
): Draw | null {
  const teams = generateTeams(signups, rand);
  if (!teams) return null;

  const [nameA, nameB] = pickTeamNames(rand);
  teams[0].name = nameA;
  teams[1].name = nameB;

  return { teams, homeIndex: rand() < 0.5 ? 0 : 1 };
}

/**
 * A seed that is stable for a given week and roster, and identical in every
 * visitor's browser. Player ids are sorted so check-in order doesn't change it.
 */
function lockSeed(weekId: string, signups: readonly Signup[]): number {
  const ids = signups
    .map((s) => s.player_id)
    .sort()
    .join("|");
  return hashSeed(`${weekId}::${ids}`);
}

/**
 * Canonical ordering for a locked draw.
 *
 * A stable *seed* is not enough on its own: `generateTeams` walks the array in
 * the order it is given, so two browsers holding the same players in a
 * different order would still produce different teams. Rows are normally
 * ordered by `created_at`, but ties are unordered in Postgres — so sort by
 * player id before locking and the ambiguity disappears.
 */
function canonical(signups: readonly Signup[]): Signup[] {
  return [...signups].sort((a, b) => a.player_id.localeCompare(b.player_id));
}

/**
 * The roster the locked draw is computed from: everyone who checked in *before*
 * the cutoff passed.
 *
 * Late arrivals still show up in the signup list — they just don't disturb
 * teams people have already read. Without this the seed would change every time
 * a straggler added their name, silently re-rolling the "locked" draw hours
 * after everyone had seen it.
 */
function rosterAtCutoff(signups: readonly Signup[], cutoff: Date): Signup[] {
  const frozen = signups.filter(
    (s) => new Date(s.created_at).getTime() < cutoff.getTime(),
  );
  // If the cutoff somehow predates every check-in, fall back to the full list
  // rather than showing an empty draw.
  return canonical(frozen.length >= 2 ? frozen : signups);
}

/**
 * Live, interactive preview of what this week's teams could look like.
 *
 * While check-in is open this reshuffles every 8–12 seconds and anyone can hit
 * "Roll the dice" to force a new one. It is explicitly a *preview*: each
 * visitor sees a different shuffle, which is fine because none of it is binding.
 *
 * At the cutoff it stops moving and locks. The locked draw is generated from a
 * **seeded** RNG keyed on the week and the roster, so every visitor's browser
 * computes the identical teams, names, captains, batting orders and home/away
 * with no server round-trip. Freezing whatever random preview each browser
 * happened to be showing would give every person a different "official" answer.
 *
 * The commissioner's published draw still overrides this entirely — see
 * `FinalDraw`, which the page renders instead of this once teams are published.
 */
export function TeamPreview({
  signups,
  weekId,
  loading,
}: {
  signups: Signup[];
  weekId: string | null;
  loading: boolean;
}) {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [rolling, setRolling] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  // Clock, resolved after mount so server and client can't disagree.
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const locked = now ? isPastCutoff(now) : false;
  const minutesLeft = now ? minutesToCutoff(now) : null;
  const enoughPlayers = signups.length >= 2;

  // ---- the locked draw: deterministic, identical for everyone --------------
  useEffect(() => {
    if (!locked || !weekId || !enoughPlayers || !now) return;
    const roster = rosterAtCutoff(signups, currentCutoffInstant(now));
    setDraw(buildDraw(roster, seededRand(lockSeed(weekId, roster))));
    // `now` ticks every 30s but the frozen roster is stable, so this settles
    // on one draw immediately and stays there.
  }, [locked, weekId, signups, enoughPlayers, now]);

  // ---- the live preview: random, reshuffling ------------------------------
  const reshuffle = useCallback(() => {
    if (!enoughPlayers) {
      setDraw(null);
      return;
    }
    setDraw(buildDraw(signups, Math.random));
  }, [signups, enoughPlayers]);

  useEffect(() => {
    if (locked) return;
    reshuffle();
  }, [locked, reshuffle]);

  useEffect(() => {
    if (locked || !enoughPlayers) return;

    const schedule = () => {
      const wait =
        REFRESH_MIN_MS + Math.random() * (REFRESH_MAX_MS - REFRESH_MIN_MS);
      timerRef.current = window.setTimeout(() => {
        // Don't burn cycles reshuffling a tab nobody is looking at.
        if (!document.hidden) reshuffle();
        schedule();
      }, wait);
    };
    schedule();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [locked, enoughPlayers, reshuffle]);

  // ---- roll the dice, with cooldown ---------------------------------------
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = window.setInterval(() => {
      setCooldownLeft((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownLeft]);

  function handleRoll() {
    if (locked || cooldownLeft > 0 || !enoughPlayers) return;
    setRolling(true);
    setCooldownLeft(Math.round(ROLL_COOLDOWN_MS / 1000));
    // Short beat so the shuffle animation reads as a real roll.
    window.setTimeout(() => {
      reshuffle();
      setRolling(false);
    }, 480);
  }

  const rollDisabled = locked || rolling || cooldownLeft > 0 || !enoughPlayers;

  return (
    <section
      aria-labelledby="preview-heading"
      className="glass-panel rounded-blob p-5 sm:p-7"
    >
      {/* ---------------------------------------------------------- header -- */}
      <div className="text-center">
        <p
          className={`text-[0.66rem] font-black tracking-[0.3em] uppercase ${
            locked
              ? "text-neon-green drop-shadow-[0_0_12px_rgba(57,255,20,0.7)]"
              : "text-neon-yellow drop-shadow-[0_0_12px_rgba(240,255,0,0.65)]"
          }`}
        >
          {locked ? "★ Teams are locked ★" : "Live preview"}
        </p>
        <h2
          id="preview-heading"
          className="text-glow-title mt-1.5 text-2xl font-black tracking-tight uppercase sm:text-3xl"
        >
          {locked ? "This week's teams" : "Possible teams"}
        </h2>
      </div>

      {/* ------------------------------------------------------- countdown -- */}
      {!locked && (
        <div className="mt-5 text-center">
          <p className="text-starlight-faint text-[0.62rem] font-black tracking-[0.26em] uppercase">
            Locks in
          </p>
          <p className="text-glow-title mt-1 text-3xl font-black tabular-nums sm:text-4xl">
            {minutesLeft === null ? "--" : formatCountdown(minutesLeft)}
          </p>
          <p className="text-starlight-faint mt-1 text-[0.6rem] font-bold tracking-[0.2em] uppercase">
            {CUTOFF_LABEL}
          </p>
        </div>
      )}

      {/* --------------------------------------------------------- message -- */}
      <p className="text-starlight-dim mx-auto mt-5 max-w-md text-center text-sm leading-relaxed">
        {locked ? (
          <>
            Check-in has closed and the draw is final. These are your teams for
            tonight — find your dugout and have fun.
          </>
        ) : (
          <>
            This is just a <span className="text-neon-cyan font-bold">preview</span>{" "}
            — the teams reshuffle every few seconds as people check in. Roll the
            dice to see another version. When the timer hits zero the teams lock
            in and become official.
          </>
        )}
      </p>

      {/* ----------------------------------------------------------- teams -- */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2" aria-hidden="true">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : !enoughPlayers ? (
          <p className="text-starlight-dim rounded-2xl border-2 border-dashed border-white/12 bg-black/20 px-4 py-8 text-center text-sm font-bold">
            Need at least 2 players checked in before we can draw teams. Add
            your name below and watch it fill up.
          </p>
        ) : draw ? (
          <div
            className={`grid gap-4 transition-opacity duration-300 sm:gap-5 md:grid-cols-2 ${
              rolling ? "opacity-30" : "opacity-100"
            }`}
          >
            <PreviewTeamCard
              team={draw.teams[0]}
              side={draw.homeIndex === 0 ? "HOME" : "AWAY"}
            />
            <PreviewTeamCard
              team={draw.teams[1]}
              side={draw.homeIndex === 1 ? "HOME" : "AWAY"}
            />
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------------ dice -- */}
      {!locked && enoughPlayers && (
        <div className="mt-6 text-center">
          <button
            onClick={handleRoll}
            disabled={rollDisabled}
            className="w-full rounded-xl px-4 py-4 text-base font-black tracking-[0.14em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:w-auto sm:px-10"
            style={{
              background: "linear-gradient(100deg, #f0ff00 0%, #39ff14 100%)",
              boxShadow:
                "0 0 34px -8px rgba(240,255,0,0.85), 0 10px 30px -12px rgba(57,255,20,0.7)",
            }}
          >
            {rolling ? (
              <span className="inline-block animate-spin">🎲</span>
            ) : cooldownLeft > 0 ? (
              `Roll again in ${cooldownLeft}s`
            ) : (
              "🎲 Roll the dice"
            )}
          </button>
          <p className="text-starlight-faint mt-3 text-[0.62rem] font-bold tracking-[0.16em] uppercase">
            Reshuffles on its own every few seconds
          </p>
        </div>
      )}
    </section>
  );
}
