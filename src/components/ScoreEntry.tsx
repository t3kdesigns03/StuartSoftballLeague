"use client";

import { useEffect, useState } from "react";

import { GenderBadge } from "@/components/GenderBadge";
import type { PublishedTeam, TeamDraw } from "@/lib/types";

/**
 * Final score entry, admin-only, filled in after the game.
 *
 * Shows both team names, which side was home (when known), and the full roster
 * for each team, so the admin always knows exactly whose game they are scoring
 * — important now that a game can be scored after the week has already rolled
 * over (see the `recovery` mode used by AdminDashboard).
 *
 * Scores are written to score_a / score_b on the team_draws row for this
 * draw's week_id. Passing null for both clears them.
 */
export function ScoreEntry({
  draw,
  onSaved,
  recovery = false,
}: {
  draw: TeamDraw;
  onSaved: () => void;
  /**
   * When true this draw is no longer the current week — it finished but its
   * score was never recorded. Renders a distinct "unscored game" banner so the
   * admin can still enter the result. See AdminDashboard's recovery list.
   */
  recovery?: boolean;
}) {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setA(draw.score_a === null ? "" : String(draw.score_a));
    setB(draw.score_b === null ? "" : String(draw.score_b));
  }, [draw.score_a, draw.score_b]);

  const [teamA, teamB] = draw.teams;
  const hasScore = draw.score_a !== null && draw.score_b !== null;
  // `home` is absent on draws published before the feature existed; only show
  // the badges when at least one side actually carries the flag.
  const showHome = teamA.home !== undefined || teamB.home !== undefined;

  async function save(clear = false) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/score", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_id: draw.week_id,
          score_a: clear ? null : Number(a),
          score_b: clear ? null : Number(b),
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      onSaved();
      setMessage(clear ? "Score cleared." : "Final score saved.");
    } catch {
      setMessage("Could not save the score. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const valid =
    a !== "" && b !== "" && Number.isInteger(Number(a)) && Number.isInteger(Number(b));

  return (
    <section
      className={`glass-panel rounded-blob mt-6 p-5 sm:p-7 ${
        recovery ? "border-2 border-neon-yellow/45 bg-neon-yellow/[0.05]" : ""
      }`}
    >
      {recovery && (
        <p className="text-neon-yellow mb-4 rounded-xl border border-[#f0ff00]/40 bg-[#f0ff00]/10 px-4 py-2.5 text-xs font-black tracking-[0.14em] uppercase">
          ⚠ Unscored game · week {draw.week_id} — enter the final result
        </p>
      )}

      <h3 className="text-starlight text-lg font-extrabold tracking-wide uppercase sm:text-xl">
        Final{" "}
        <span className="text-neon-yellow drop-shadow-[0_0_12px_rgba(240,255,0,0.6)]">
          score
        </span>
      </h3>
      <p className="text-starlight-faint mt-1 text-xs font-bold tracking-[0.16em] uppercase">
        {recovery
          ? "This week already rolled over · score it to close it out"
          : "Enter after the game · shows on the public page"}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TeamScoreColumn
          team={teamA}
          accent="cyan"
          value={a}
          onChange={setA}
          showHome={showHome}
        />
        <TeamScoreColumn
          team={teamB}
          accent="magenta"
          value={b}
          onChange={setB}
          showHome={showHome}
        />
      </div>

      {message && (
        <p
          role="status"
          className="text-neon-yellow mt-4 rounded-xl border border-[#f0ff00]/35 bg-[#f0ff00]/8 px-4 py-2.5 text-sm font-bold"
        >
          {message}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => save(false)}
          disabled={busy || !valid}
          className="flex-1 rounded-xl px-4 py-3.5 text-base font-black tracking-[0.14em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          style={{
            background: "linear-gradient(100deg, #39ff14 0%, #00f0ff 100%)",
            boxShadow: "0 0 30px -8px rgba(57,255,20,0.85)",
          }}
        >
          {busy ? "Saving…" : hasScore ? "Update score" : "Save final score"}
        </button>
        {hasScore && (
          <button
            onClick={() => save(true)}
            disabled={busy}
            className="text-starlight-dim rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-3.5 text-sm font-bold tracking-[0.12em] uppercase transition-all duration-300 hover:border-white/25 disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>
    </section>
  );
}

/** One team's block: name, home/away tag, roster, and its numeric score input. */
function TeamScoreColumn({
  team,
  accent,
  value,
  onChange,
  showHome,
}: {
  team: PublishedTeam;
  accent: "cyan" | "magenta";
  value: string;
  onChange: (v: string) => void;
  showHome: boolean;
}) {
  const nameColor = accent === "cyan" ? "text-neon-cyan" : "text-neon-magenta";
  const focusRing =
    accent === "cyan"
      ? "focus:border-neon-cyan/70 focus:shadow-[0_0_0_4px_rgba(0,240,255,0.14)]"
      : "focus:border-neon-magenta/70 focus:shadow-[0_0_0_4px_rgba(255,0,170,0.14)]";

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`${nameColor} min-w-0 flex-1 truncate text-sm font-black tracking-[0.12em] uppercase`}
        >
          {team.name}
        </span>
        {showHome && team.home !== undefined && (
          <span
            className={`shrink-0 rounded-md border px-2 py-0.5 text-[0.55rem] font-black tracking-[0.16em] uppercase ${
              team.home
                ? "border-neon-green/50 text-neon-green bg-neon-green/10"
                : "text-starlight-faint border-white/15 bg-white/[0.03]"
            }`}
          >
            {team.home ? "Home" : "Away"}
          </span>
        )}
      </div>

      <ul className="mt-2.5 flex flex-col gap-1">
        {team.players.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 text-[0.82rem] leading-tight"
          >
            <GenderBadge gender={p.gender} />
            <span className="text-starlight min-w-0 flex-1 truncate font-semibold">
              {p.name}
              {p.id === team.captain_id && (
                <span className="text-neon-yellow ml-1.5 text-[0.6rem] font-black tracking-[0.1em] uppercase">
                  ★ C
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-label={`${team.name} score`}
        className={`text-starlight mt-3 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-center text-2xl font-black tabular-nums outline-none transition ${focusRing}`}
      />
    </div>
  );
}
