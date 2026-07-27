"use client";

import { useEffect, useState } from "react";

import type { TeamDraw } from "@/lib/types";

/**
 * Final score entry, admin-only, filled in after the game.
 *
 * Only appears once a draw is published — the score belongs to a specific
 * week's teams, so there is nothing to attach it to before then.
 */
export function ScoreEntry({
  draw,
  onSaved,
}: {
  draw: TeamDraw;
  onSaved: () => void;
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
    <section className="glass-panel rounded-blob mt-6 p-5 sm:p-7">
      <h3 className="text-starlight text-lg font-extrabold tracking-wide uppercase sm:text-xl">
        Final{" "}
        <span className="text-neon-yellow drop-shadow-[0_0_12px_rgba(240,255,0,0.6)]">
          score
        </span>
      </h3>
      <p className="text-starlight-faint mt-1 text-xs font-bold tracking-[0.16em] uppercase">
        Enter after the game · shows on the public page
      </p>

      <div className="mt-5 flex items-end justify-center gap-3 sm:gap-5">
        <label className="flex-1 text-center">
          <span className="text-neon-cyan block truncate text-xs font-black tracking-[0.14em] uppercase">
            {teamA.name}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="0"
            aria-label={`${teamA.name} score`}
            className="text-starlight focus:border-neon-cyan/70 focus:shadow-[0_0_0_4px_rgba(0,240,255,0.14)] mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-center text-2xl font-black tabular-nums outline-none transition"
          />
        </label>

        <span className="text-starlight-faint pb-4 text-sm font-black">vs</span>

        <label className="flex-1 text-center">
          <span className="text-neon-magenta block truncate text-xs font-black tracking-[0.14em] uppercase">
            {teamB.name}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="0"
            aria-label={`${teamB.name} score`}
            className="text-starlight focus:border-neon-magenta/70 focus:shadow-[0_0_0_4px_rgba(255,0,170,0.14)] mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-center text-2xl font-black tabular-nums outline-none transition"
          />
        </label>
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
