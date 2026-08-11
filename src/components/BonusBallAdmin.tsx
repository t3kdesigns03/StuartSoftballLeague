"use client";

import { useCallback, useEffect, useState } from "react";

type Status = {
  enabled: boolean;
  week_id: string;
  count: number;
  total_cents: number;
  names: string[];
};

/**
 * Commissioner control for the Bonus Ball pool.
 *
 * One switch to open or close the pool (writes league_state.bonus_ball_enabled
 * through /api/admin/bonus), plus the full entrant list and running total for
 * the open week. The admin route reads with the secret key, so this always sees
 * everything — unlike the public page, which gates the list behind membership.
 */
export function BonusBallAdmin() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/bonus");
      if (!res.ok) throw new Error(String(res.status));
      setStatus((await res.json()) as Status);
      setError(null);
    } catch {
      setError("Could not load the Bonus Ball status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(next: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await load();
    } catch {
      setError("Could not change the switch. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const dollars = status ? status.total_cents / 100 : 0;
  const on = Boolean(status?.enabled);

  return (
    <section className="glass-panel rounded-blob mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-starlight text-lg font-extrabold tracking-wide uppercase">
            🍦 Bonus Ball
          </h3>
          <p className="text-starlight-faint mt-1 text-xs">
            Voluntary $5 weekly pool. Off by default — flip it on the week the
            balls arrive.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={loading || saving}
          onClick={() => toggle(!on)}
          className={`relative h-9 w-16 shrink-0 rounded-full border-2 transition-all duration-300 disabled:opacity-50 ${
            on
              ? "border-neon-magenta bg-neon-magenta/30 shadow-[0_0_24px_-6px_rgba(255,0,170,0.9)]"
              : "border-white/20 bg-white/[0.04]"
          }`}
        >
          <span
            className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full transition-all duration-300 ${
              on
                ? "left-8 bg-neon-magenta shadow-[0_0_12px_rgba(255,0,170,0.9)]"
                : "left-1 bg-starlight-faint"
            }`}
          />
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <span
          className={`text-[0.68rem] font-black tracking-[0.16em] uppercase ${
            on ? "text-neon-green" : "text-starlight-faint"
          }`}
        >
          {loading ? "Loading…" : on ? "● Pool is open" : "○ Pool is closed"}
        </span>
      </div>

      {status && (
        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="rounded-xl border border-neon-magenta/25 bg-neon-magenta/[0.06] px-5 py-4 text-center">
            <p className="text-starlight-faint text-[0.58rem] font-black tracking-[0.22em] uppercase">
              In the pot
            </p>
            <p className="text-glow-title text-4xl font-black tabular-nums">
              ${dollars}
            </p>
            <p className="text-starlight-dim mt-0.5 text-xs font-bold">
              {status.count} {status.count === 1 ? "entry" : "entries"}
            </p>
          </div>

          <div>
            <p className="text-starlight-faint text-[0.58rem] font-black tracking-[0.22em] uppercase">
              Entrants this week
            </p>
            {status.names.length === 0 ? (
              <p className="text-starlight-dim mt-2 text-sm">
                Nobody has entered yet.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {status.names.map((name, i) => (
                  <li
                    key={`${name}-${i}`}
                    className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-starlight"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
