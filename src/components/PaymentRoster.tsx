"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { GenderBadge } from "@/components/GenderBadge";
import type { Player } from "@/lib/types";
import { SEASON_FEE } from "@/lib/types";

type Filter = "all" | "unpaid" | "paid";

/**
 * Permanent roster with the one-time season fee tracked per person.
 *
 * Everyone who has ever checked in appears here and stays here — starting a new
 * week does not clear this list, and marking someone paid persists for the
 * season. All reads and writes go through /api/admin/players, which is gated by
 * the admin cookie; the browser has no direct access to the players table.
 */
export function PaymentRoster() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/players");
      if (!response.ok) throw new Error(String(response.status));
      const { players: data } = (await response.json()) as { players: Player[] };
      setPlayers(data);
      setError(null);
    } catch {
      setError("Could not load the roster.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePaid(player: Player) {
    const next = !player.paid;

    // Optimistic: flip immediately, roll back if the server disagrees.
    setPlayers((current) =>
      (current ?? []).map((p) => (p.id === player.id ? { ...p, paid: next } : p)),
    );
    setPending((s) => new Set(s).add(player.id));

    try {
      const response = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: player.id, paid: next }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const { player: saved } = (await response.json()) as { player: Player };
      setPlayers((current) =>
        (current ?? []).map((p) =>
          p.id === saved.id ? { ...p, ...saved, weeks_played: p.weeks_played } : p,
        ),
      );
      setError(null);
    } catch {
      setPlayers((current) =>
        (current ?? []).map((p) =>
          p.id === player.id ? { ...p, paid: player.paid } : p,
        ),
      );
      setError(`Could not update ${player.name}. Try again.`);
    } finally {
      setPending((s) => {
        const next = new Set(s);
        next.delete(player.id);
        return next;
      });
    }
  }

  const stats = useMemo(() => {
    const list = players ?? [];
    const paid = list.filter((p) => p.paid).length;
    return {
      total: list.length,
      paid,
      unpaid: list.length - paid,
      outstanding: (list.length - paid) * SEASON_FEE,
      collected: paid * SEASON_FEE,
    };
  }, [players]);

  const visible = useMemo(() => {
    const list = players ?? [];
    if (filter === "paid") return list.filter((p) => p.paid);
    if (filter === "unpaid") return list.filter((p) => !p.paid);
    return list;
  }, [players, filter]);

  return (
    <section className="glass-panel rounded-blob mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-starlight text-lg font-extrabold tracking-wide uppercase sm:text-xl">
            Season dues{" "}
            <span className="text-neon-yellow drop-shadow-[0_0_12px_rgba(240,255,0,0.6)]">
              ${SEASON_FEE}
            </span>
          </h3>
          <p className="text-starlight-faint mt-1 text-xs font-bold tracking-[0.16em] uppercase">
            Permanent roster · paid once, stays paid
          </p>
        </div>

        {players && players.length > 0 && (
          <div className="text-right">
            <p className="text-neon-green text-2xl font-black tabular-nums drop-shadow-[0_0_14px_rgba(57,255,20,0.55)]">
              ${stats.collected}
            </p>
            {stats.outstanding > 0 && (
              <p className="text-starlight-faint text-xs font-bold tracking-wider uppercase">
                ${stats.outstanding} outstanding
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
        >
          {error}
        </p>
      )}

      {players && players.length > 0 && (
        <div className="mt-5 flex gap-2">
          {(
            [
              ["all", `All ${stats.total}`],
              ["unpaid", `Unpaid ${stats.unpaid}`],
              ["paid", `Paid ${stats.paid}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-black tracking-[0.12em] uppercase transition-all duration-300 ${
                filter === value
                  ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10 shadow-[0_0_20px_-6px_rgba(0,240,255,0.9)]"
                  : "text-starlight-faint hover:text-starlight-dim border-white/12 bg-white/[0.02] hover:border-white/25"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        {!players ? (
          <ul className="space-y-2.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <li
                key={i}
                className="h-14 animate-pulse rounded-xl border border-white/5 bg-white/[0.04]"
              />
            ))}
          </ul>
        ) : players.length === 0 ? (
          <p className="text-starlight-dim rounded-2xl border-2 border-dashed border-white/12 bg-black/20 px-4 py-9 text-center text-sm font-bold">
            Nobody on the roster yet. Players appear here the first time they
            check in.
          </p>
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {visible.map((player) => {
              const busy = pending.has(player.id);
              return (
                <li
                  key={player.id}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-300 ${
                    player.paid
                      ? "border-[#39ff14]/35 bg-[#39ff14]/[0.06]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-starlight truncate font-bold">
                      {player.name}
                    </p>
                    <p className="text-starlight-faint mt-0.5 text-[0.68rem] font-bold tracking-[0.14em] uppercase">
                      {player.weeks_played ?? 0}{" "}
                      {player.weeks_played === 1 ? "week" : "weeks"} played
                    </p>
                  </div>

                  <GenderBadge gender={player.gender} />

                  <button
                    onClick={() => togglePaid(player)}
                    disabled={busy}
                    aria-pressed={player.paid}
                    aria-label={
                      player.paid
                        ? `Mark ${player.name} unpaid`
                        : `Mark ${player.name} paid`
                    }
                    className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-xs font-black tracking-[0.1em] uppercase transition-all duration-300 active:scale-95 disabled:opacity-50 ${
                      player.paid
                        ? "border-[#39ff14]/70 bg-[#39ff14]/15 text-[#39ff14] shadow-[0_0_22px_-8px_rgba(57,255,20,0.95)]"
                        : "text-starlight-faint hover:border-neon-yellow/60 hover:text-neon-yellow border-white/15 bg-white/[0.02]"
                    }`}
                  >
                    {player.paid ? "✓ Paid" : "Unpaid"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {players && players.length > 0 && visible.length === 0 && (
          <p className="text-starlight-faint py-6 text-center text-sm font-bold">
            Nobody in this filter.
          </p>
        )}
      </div>
    </section>
  );
}
