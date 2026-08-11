"use client";

import { useMemo, useState } from "react";

import { suggestPartners } from "@/lib/partnerSuggest";
import { supabase } from "@/lib/supabase";
import type { Gender, Signup } from "@/lib/types";

type Props = {
  weekId: string | null;
  /** This week's check-ins, used to suggest a partner. */
  signups?: Signup[];
  /** Called after a successful insert so the list can update instantly. */
  onSignedUp?: () => void;
};

const GENDER_OPTIONS: {
  value: Gender;
  label: string;
  emoji: string;
  active: string;
  idle: string;
}[] = [
  {
    value: "guy",
    label: "Guy",
    emoji: "🧢",
    active:
      "border-neon-cyan bg-neon-cyan/12 text-neon-cyan shadow-[0_0_28px_-6px_rgba(0,240,255,0.95),inset_0_0_22px_-14px_rgba(0,240,255,0.9)] scale-[1.03]",
    idle: "border-white/10 bg-white/[0.03] text-starlight-dim hover:border-neon-cyan/45 hover:text-neon-cyan/85 hover:bg-neon-cyan/[0.06]",
  },
  {
    value: "girl",
    label: "Girl",
    emoji: "🥎",
    active:
      "border-neon-magenta bg-neon-magenta/12 text-neon-magenta shadow-[0_0_28px_-6px_rgba(255,0,170,0.95),inset_0_0_22px_-14px_rgba(255,0,170,0.9)] scale-[1.03]",
    idle: "border-white/10 bg-white/[0.03] text-starlight-dim hover:border-neon-magenta/45 hover:text-neon-magenta/85 hover:bg-neon-magenta/[0.06]",
  },
];

export function SignupForm({ weekId, signups = [], onSignedUp }: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [withPartner, setWithPartner] = useState(false);
  const [partner, setPartner] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const disabled = status === "saving" || !weekId;

  // Suggestions, never assumptions. Recomputed as they type their name.
  const suggestions = useMemo(
    () => suggestPartners(name, signups),
    [name, signups],
  );
  const waitingOnYou = suggestions.find((s) => s.reason === "waiting");

  function acceptSuggestion(partnerName: string) {
    setWithPartner(true);
    setPartner(partnerName);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    const partnerName = partner.trim();
    if (!trimmed) return setError("Please enter your name.");
    if (!gender) return setError("Please pick Guy or Girl.");
    if (withPartner && !partnerName) {
      return setError("Add your partner's name, or untick the box.");
    }
    if (withPartner && partnerName.toLowerCase() === trimmed.toLowerCase()) {
      return setError("That's your own name — enter your partner's.");
    }
    if (!weekId) return setError("Still loading — try again in a second.");

    setStatus("saving");
    // check_in() finds-or-creates the roster entry and records this week's
    // check-in in one step. Checking in twice updates rather than erroring, so
    // people can fix a typo by submitting again.
    const { error: rpcError } = await supabase.rpc("check_in", {
      p_name: trimmed,
      p_gender: gender,
      p_partner: withPartner ? partnerName : null,
    });

    if (rpcError) {
      setStatus("idle");
      setError("Could not save your check-in. Please try again.");
      return;
    }

    setStatus("done");
    setName("");
    setGender(null);
    setWithPartner(false);
    setPartner("");
    onSignedUp?.();
    setTimeout(() => setStatus("idle"), 2600);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel glass-panel-hover rounded-blob p-5 sm:p-7"
    >
      <h2 className="text-starlight text-xl font-extrabold tracking-wide uppercase sm:text-2xl">
        Play this{" "}
        <span className="text-neon-yellow drop-shadow-[0_0_12px_rgba(240,255,0,0.6)]">
          week
        </span>
      </h2>
      <p className="text-starlight-dim mt-1.5 text-sm">
        Add your name by <span className="whitespace-nowrap">Tuesday 6 PM</span>{" "}
        to get on a team.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="name"
            className="text-starlight-dim block text-xs font-bold tracking-[0.2em] uppercase"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            enterKeyHint="done"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jordan Rivera"
            className="text-starlight placeholder:text-starlight-faint/60 focus:border-neon-cyan/70 focus:shadow-[0_0_0_4px_rgba(0,240,255,0.14),0_0_28px_-8px_rgba(0,240,255,0.85)] mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3.5 text-base outline-none transition duration-300"
          />
        </div>

        <fieldset>
          <legend className="text-starlight-dim text-xs font-bold tracking-[0.2em] uppercase">
            I&rsquo;m a
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((option) => {
              const isActive = gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setGender(option.value)}
                  className={`flex items-center justify-center gap-2 rounded-full border-2 px-4 py-3.5 text-base font-bold tracking-wide uppercase transition-all duration-300 ease-out active:scale-[0.97] ${
                    isActive ? option.active : option.idle
                  }`}
                >
                  <span aria-hidden="true" className="text-lg">
                    {option.emoji}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Someone already named you — one tap completes the pair. */}
        {waitingOnYou && !withPartner && (
          <button
            type="button"
            onClick={() => acceptSuggestion(waitingOnYou.name)}
            className="border-neon-purple/55 bg-neon-purple/10 animate-pop-in w-full rounded-xl border-2 px-4 py-3.5 text-left shadow-[0_0_28px_-10px_rgba(176,0,255,0.95)] transition-all duration-300 hover:bg-neon-purple/[0.16]"
          >
            <p className="text-neon-purple text-sm font-black">
              <span aria-hidden="true" className="mr-1.5">
                🥎💜
              </span>
              {waitingOnYou.name} is waiting for you
            </p>
            <p className="text-starlight-dim mt-1 text-xs font-bold">
              Tap to team up — you&rsquo;ll be drawn onto the same team.
            </p>
          </button>
        )}

        {/* Optional partner pairing */}
        <div>
          <button
            type="button"
            role="checkbox"
            aria-checked={withPartner}
            onClick={() => setWithPartner((v) => !v)}
            className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-300 ${
              withPartner
                ? "border-neon-purple bg-neon-purple/10 shadow-[0_0_26px_-8px_rgba(176,0,255,0.95)]"
                : "hover:border-neon-purple/45 border-white/10 bg-white/[0.03]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-black transition-all duration-300 ${
                withPartner
                  ? "border-neon-purple bg-neon-purple text-white"
                  : "border-white/25"
              }`}
            >
              {withPartner ? "✓" : ""}
            </span>
            <span
              className={`text-sm font-bold ${
                withPartner ? "text-neon-purple" : "text-starlight-dim"
              }`}
            >
              Keep me on the same team as my partner
            </span>
          </button>

          {withPartner && (
            <div className="animate-pop-in mt-3">
              <label
                htmlFor="partner"
                className="text-starlight-dim block text-xs font-bold tracking-[0.2em] uppercase"
              >
                Partner&rsquo;s full name
              </label>
              <input
                id="partner"
                name="partner"
                type="text"
                autoComplete="off"
                maxLength={60}
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder="Casey Rivera"
                className="text-starlight placeholder:text-starlight-faint/60 focus:border-neon-purple/70 focus:shadow-[0_0_0_4px_rgba(176,0,255,0.14),0_0_28px_-8px_rgba(176,0,255,0.85)] mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3.5 text-base outline-none transition duration-300"
              />
              {suggestions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {suggestions.map((s) => {
                    const chosen =
                      partner.trim().toLowerCase() === s.name.toLowerCase();
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => acceptSuggestion(s.name)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                          chosen
                            ? "border-neon-purple bg-neon-purple/20 text-neon-purple"
                            : "text-starlight-dim hover:border-neon-purple/60 hover:text-neon-purple border-white/15 bg-white/[0.03]"
                        }`}
                      >
                        <span aria-hidden="true" className="mr-1">
                          {s.reason === "waiting" ? "💜" : "👀"}
                        </span>
                        {s.name}
                        <span className="text-starlight-faint ml-1.5 font-normal">
                          {s.reason === "waiting"
                            ? "is waiting for you"
                            : "also playing"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-starlight-faint mt-2 text-xs">
                They need to check in too and name you back — that&rsquo;s how we
                confirm it&rsquo;s mutual.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
          >
            {error}
          </p>
        )}

        {status === "done" && (
          <p
            role="status"
            className="text-neon-green animate-pop-in rounded-xl border border-[#39ff14]/40 bg-[#39ff14]/10 px-4 py-3 text-sm font-bold shadow-[0_0_28px_-10px_rgba(57,255,20,0.9)]"
          >
            You&rsquo;re in! See you Tuesday. ⚾
          </p>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="group relative w-full overflow-hidden rounded-xl px-4 py-4 text-base font-black tracking-[0.14em] text-black uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          style={{
            background: "linear-gradient(100deg, #39ff14 0%, #00f0ff 100%)",
            boxShadow:
              "0 0 34px -8px rgba(57,255,20,0.85), 0 10px 30px -12px rgba(0,240,255,0.7)",
          }}
        >
          <span className="relative z-10">
            {status === "saving" ? "Signing up…" : "Sign me up"}
          </span>
          {/* Light sweep on hover */}
          <span
            className="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)",
              backgroundSize: "200% 100%",
              animation: "sweep 1.1s linear infinite",
            }}
          />
        </button>
      </div>
    </form>
  );
}
