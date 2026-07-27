"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GenderBadge } from "@/components/GenderBadge";
import { Header } from "@/components/Header";
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <Header subtitle="Commissioner dashboard" />

      <div className="border-field-100 shadow-field-900/5 mt-8 rounded-3xl border bg-white/85 p-5 shadow-lg backdrop-blur sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-field-900 text-xl font-bold sm:text-2xl">
              {loading ? "Loading…" : `${signups.length} signed up`}
            </h2>
            <p className="text-field-700/60 mt-0.5 font-mono text-xs">
              week: {weekId ?? "…"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-field-700/70 hover:text-field-900 text-sm font-semibold underline underline-offset-4"
          >
            Log out
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="bg-sun-50 text-sun-700 mt-4 rounded-xl px-4 py-3 text-sm font-semibold"
          >
            {notice}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGenerate}
            disabled={loading || signups.length < 2}
            className="from-field-500 to-field-600 shadow-field-600/25 hover:to-field-700 flex-1 rounded-xl bg-gradient-to-b px-4 py-3.5 text-base font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {teams ? "Re-draw teams" : "Generate teams"}
          </button>

          {confirmingReset ? (
            <div className="flex flex-1 gap-2">
              <button
                onClick={handleNewWeek}
                disabled={busy}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Clearing…" : "Yes, clear it"}
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="border-field-200 text-field-700 hover:bg-field-50 rounded-xl border-2 px-4 py-3.5 text-base font-semibold transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="border-field-200 text-field-700 hover:bg-field-50 flex-1 rounded-xl border-2 bg-white px-4 py-3.5 text-base font-semibold transition"
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
        <section className="border-field-100 shadow-field-900/5 mt-6 rounded-3xl border bg-white/85 p-5 shadow-lg backdrop-blur sm:p-7">
          <h3 className="text-field-900 text-lg font-bold">Signed up</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {signups.map((signup) => (
              <li
                key={signup.id}
                className="border-field-100 bg-field-50/40 flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
              >
                <span className="text-field-900 min-w-0 flex-1 truncate font-semibold">
                  {signup.name}
                </span>
                <GenderBadge gender={signup.gender} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="text-field-700/50 mt-12 text-center text-xs font-medium">
        <Link
          href="/"
          className="hover:text-field-700 underline underline-offset-4 transition"
        >
          Back to signup page
        </Link>
      </footer>
    </main>
  );
}
