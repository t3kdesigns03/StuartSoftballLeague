"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GenderBadge } from "@/components/GenderBadge";
import { Header } from "@/components/Header";
import { PaymentRoster } from "@/components/PaymentRoster";
import { TeamCard } from "@/components/TeamCard";
import { useSignups } from "@/hooks/useSignups";
import { generateTeams } from "@/lib/teams";
import type { Team } from "@/lib/types";
import { startNewWeek } from "@/lib/week";

export function AdminDashboard() {
  const router = useRouter();
  const { weekId, setWeekId, signups, loading, error } = useSignups();
  const [teams, setTeams] = useState<[Team, Team] | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleGenerate() {
    const result = generateTeams(signups);
    if (!result) {
      setNotice("Need at least 2 players signed up to make teams.");
      return;
    }
    setNotice(null);
    setTeams(result);
  }

  async function handleNewWeek() {
    setBusy(true);
    try {
      const next = await startNewWeek();
      setTeams(null);
      setConfirmingReset(false);
      setWeekId(next);
      setNotice("New week started. Signups are cleared.");
    } catch {
      setNotice("Could not start a new week. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Header subtitle="Commissioner dashboard" />

      <div className="glass-panel rounded-blob mt-10 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-starlight text-xl font-extrabold tracking-wide uppercase sm:text-2xl">
              {loading ? (
                "Loading…"
              ) : (
                <>
                  <span className="text-neon-yellow drop-shadow-[0_0_12px_rgba(240,255,0,0.6)]">
                    {signups.length}
                  </span>{" "}
                  signed up
                </>
              )}
            </h2>
            <p className="text-starlight-faint mt-1 font-mono text-[0.7rem] tracking-wider">
              week: {weekId ?? "…"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-starlight-faint hover:text-neon-cyan text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-300"
          >
            Log out
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="text-neon-yellow animate-pop-in mt-4 rounded-xl border border-[#f0ff00]/35 bg-[#f0ff00]/8 px-4 py-3 text-sm font-bold"
          >
            {notice}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGenerate}
            disabled={loading || signups.length < 2}
            className="flex-1 rounded-xl px-4 py-4 text-base font-black tracking-[0.14em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            style={{
              background: "linear-gradient(100deg, #39ff14 0%, #00f0ff 100%)",
              boxShadow:
                "0 0 34px -8px rgba(57,255,20,0.85), 0 10px 30px -12px rgba(0,240,255,0.7)",
            }}
          >
            {teams ? "Re-draw teams" : "Generate teams"}
          </button>

          {confirmingReset ? (
            <div className="flex flex-1 gap-2">
              <button
                onClick={handleNewWeek}
                disabled={busy}
                className="flex-1 rounded-xl border-2 border-red-500/60 bg-red-500/15 px-4 py-4 text-base font-black tracking-[0.12em] text-red-300 uppercase shadow-[0_0_30px_-10px_rgba(239,68,68,0.9)] transition-all duration-300 hover:bg-red-500/25 disabled:opacity-50"
              >
                {busy ? "Clearing…" : "Yes, clear it"}
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="text-starlight-dim rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-4 text-base font-bold tracking-[0.12em] uppercase transition-all duration-300 hover:border-white/25"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="text-neon-purple border-neon-purple/40 hover:border-neon-purple/80 hover:bg-neon-purple/10 flex-1 rounded-xl border-2 bg-white/[0.02] px-4 py-4 text-base font-black tracking-[0.12em] uppercase transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(176,0,255,0.9)]"
            >
              Start new week
            </button>
          )}
        </div>
      </div>

      {teams && (
        <div className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-2">
          <TeamCard team={teams[0]} />
          <TeamCard team={teams[1]} />
        </div>
      )}

      {!teams && !loading && signups.length > 0 && (
        <section className="glass-panel rounded-blob mt-6 p-5 sm:p-7">
          <h3 className="text-starlight text-lg font-extrabold tracking-wide uppercase">
            Signed up
          </h3>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {signups.map((signup) => (
              <li
                key={signup.id}
                className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-3.5 py-2.5 transition-colors duration-300 ${
                  signup.gender === "guy"
                    ? "border-neon-cyan/18 hover:border-neon-cyan/45"
                    : "border-neon-magenta/18 hover:border-neon-magenta/45"
                }`}
              >
                <span className="text-starlight min-w-0 flex-1 truncate font-bold">
                  {signup.name}
                </span>
                <GenderBadge gender={signup.gender} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <PaymentRoster />

      <footer className="mt-14 text-center">
        <Link
          href="/"
          className="text-starlight-faint hover:text-neon-cyan text-xs font-black tracking-[0.24em] uppercase transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]"
        >
          <span className="border-b border-current pb-0.5">
            Back to signup page
          </span>
        </Link>
      </footer>
    </main>
  );
}
