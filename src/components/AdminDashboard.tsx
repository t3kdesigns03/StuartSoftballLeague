"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GenderBadge } from "@/components/GenderBadge";
import { Header } from "@/components/Header";
import { PaymentRoster } from "@/components/PaymentRoster";
import { ScoreEntry } from "@/components/ScoreEntry";
import { SiteFooter } from "@/components/SiteFooter";
import { TeamCard } from "@/components/TeamCard";
import { useSignups } from "@/hooks/useSignups";
import { useTeamDraw } from "@/hooks/useTeamDraw";
import { formatCountdown, isPastCutoff, minutesToCutoff } from "@/lib/cutoff";
import { describeBalance, generateTeams } from "@/lib/teams";
import type { Team } from "@/lib/types";
import { toPublishedTeams } from "@/lib/types";
import { startNewWeek } from "@/lib/week";

export function AdminDashboard() {
  const router = useRouter();
  const { weekId, setWeekId, signups, loading, error } = useSignups();
  const { draw, reload: reloadDraw } = useTeamDraw(weekId);
  const [teams, setTeams] = useState<[Team, Team] | null>(null);
  const balance = teams ? describeBalance(teams, signups) : null;
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Soft deadline, refreshed each minute. Drives emphasis only — nothing locks.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const pastCutoff = isPastCutoff(now);
  const countdown = formatCountdown(minutesToCutoff(now));

  const isLive = Boolean(draw?.published);

  function handleGenerate() {
    const result = generateTeams(signups);
    if (!result) {
      setNotice("Need at least 2 players checked in to make teams.");
      return;
    }
    setNotice(null);
    setTeams(result);
  }

  async function handlePublish() {
    if (!teams || !weekId) return;
    setPublishing(true);
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_id: weekId, teams: toPublishedTeams(teams) }),
      });
      if (!response.ok) throw new Error(String(response.status));
      reloadDraw();
      setNotice("Teams are live on the public page.");
    } catch {
      setNotice("Could not publish teams. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!weekId) return;
    setPublishing(true);
    try {
      const response = await fetch(
        `/api/admin/teams?week_id=${encodeURIComponent(weekId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(String(response.status));
      reloadDraw();
      setNotice("Teams pulled from the public page.");
    } catch {
      setNotice("Could not retract teams. Please try again.");
    } finally {
      setPublishing(false);
    }
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
            <p className="mt-1.5 text-[0.68rem] font-black tracking-[0.16em] uppercase">
              {isLive ? (
                <span className="text-neon-green drop-shadow-[0_0_10px_rgba(57,255,20,0.6)]">
                  ● Teams are live
                </span>
              ) : pastCutoff ? (
                <span className="text-neon-yellow drop-shadow-[0_0_10px_rgba(240,255,0,0.6)]">
                  Check-in closed · time to draw
                </span>
              ) : (
                <span className="text-starlight-faint">
                  Check-in closes in {countdown}
                </span>
              )}
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
        <>
          <div className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-2">
            <TeamCard team={teams[0]} />
            <TeamCard team={teams[1]} />
          </div>

          {balance && (balance.lopsided || balance.pairsKept > 0) && (
            <div
              className={`rounded-blob mt-5 border-2 p-4 sm:p-5 ${
                balance.lopsided
                  ? "border-neon-yellow/45 bg-neon-yellow/[0.07]"
                  : "border-neon-purple/35 bg-neon-purple/[0.06]"
              }`}
            >
              {balance.pairsKept > 0 && (
                <p className="text-neon-purple text-sm font-bold">
                  🔗 {balance.pairsKept}{" "}
                  {balance.pairsKept === 1 ? "couple" : "couples"} kept together.
                </p>
              )}
              {balance.lopsided && (
                <p
                  className={`text-neon-yellow text-sm font-bold ${
                    balance.pairsKept > 0 ? "mt-1.5" : ""
                  }`}
                >
                  Teams came out uneven — {balance.sizeGap} apart in size
                  {balance.guyGap > 1 && `, ${balance.guyGap} in guys`}
                  {balance.girlGap > 1 && `, ${balance.girlGap} in girls`}. Pairs
                  are never split, so re-draw for a different split.
                </p>
              )}
            </div>
          )}

          <div className="glass-panel rounded-blob mt-5 p-5 sm:p-6">
            <p className="text-starlight-dim text-sm">
              {isLive
                ? "A draw is already live. Publishing again replaces it."
                : "Nothing is public until you publish. Re-draw as many times as you like first."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className={`flex-1 rounded-xl px-4 py-4 text-base font-black tracking-[0.14em] uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${
                  pastCutoff ? "text-black" : "text-black"
                }`}
                style={{
                  background: pastCutoff
                    ? "linear-gradient(100deg, #f0ff00 0%, #39ff14 100%)"
                    : "linear-gradient(100deg, #39ff14 0%, #00f0ff 100%)",
                  boxShadow: pastCutoff
                    ? "0 0 40px -6px rgba(240,255,0,0.9), 0 10px 30px -12px rgba(57,255,20,0.8)"
                    : "0 0 34px -8px rgba(57,255,20,0.85), 0 10px 30px -12px rgba(0,240,255,0.7)",
                }}
              >
                {publishing
                  ? "Publishing…"
                  : pastCutoff
                    ? "★ Publish final teams ★"
                    : isLive
                      ? "Replace published teams"
                      : "Publish to main page"}
              </button>

              {isLive && (
                <button
                  onClick={handleUnpublish}
                  disabled={publishing}
                  className="text-starlight-dim rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-4 text-base font-bold tracking-[0.12em] uppercase transition-all duration-300 hover:border-white/25 disabled:opacity-50"
                >
                  Pull it down
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {!teams && isLive && draw && (
        <div className="glass-panel rounded-blob mt-6 p-5 sm:p-6">
          <p className="text-neon-green text-sm font-bold">
            ● Teams for this week are live on the public page.
          </p>
          <p className="text-starlight-faint mt-1 text-xs">
            Generate again above to re-draw and replace them.
          </p>
          <button
            onClick={handleUnpublish}
            disabled={publishing}
            className="text-starlight-dim mt-4 rounded-xl border-2 border-white/12 bg-white/[0.03] px-4 py-3 text-sm font-bold tracking-[0.12em] uppercase transition-all duration-300 hover:border-white/25 disabled:opacity-50"
          >
            Pull it down
          </button>
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

      {isLive && draw && <ScoreEntry draw={draw} onSaved={reloadDraw} />}

      <PaymentRoster />

      <SiteFooter />
    </main>
  );
}
