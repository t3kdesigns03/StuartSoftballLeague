"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Gender } from "@/lib/types";

type Props = {
  weekId: string | null;
  /** Called after a successful insert so the list can update instantly. */
  onSignedUp?: () => void;
};

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: "guy", label: "Guy", emoji: "🧢" },
  { value: "girl", label: "Girl", emoji: "🥎" },
];

export function SignupForm({ weekId, onSignedUp }: Props) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const disabled = status === "saving" || !weekId;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter your name.");
    if (!gender) return setError("Please pick Guy or Girl.");
    if (!weekId) return setError("Still loading — try again in a second.");

    setStatus("saving");
    const { error: insertError } = await supabase
      .from("signups")
      .insert({ name: trimmed, gender, week_id: weekId });

    if (insertError) {
      setStatus("idle");
      setError(
        insertError.code === "23505"
          ? "Looks like that name is already signed up this week."
          : "Could not save your signup. Please try again.",
      );
      return;
    }

    setStatus("done");
    setName("");
    setGender(null);
    onSignedUp?.();
    setTimeout(() => setStatus("idle"), 2600);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-field-100 bg-white/85 p-5 shadow-lg shadow-field-900/5 backdrop-blur sm:p-7"
    >
      <h2 className="text-field-900 text-xl font-bold sm:text-2xl">
        Play this week
      </h2>
      <p className="text-field-700/70 mt-1 text-sm">
        Add your name by Monday night to get on a team.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="name"
            className="text-field-800 block text-sm font-semibold"
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
            className="border-field-200 placeholder:text-field-700/35 focus:border-field-500 focus:ring-field-400/40 mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-base outline-none transition focus:ring-4"
          />
        </div>

        <fieldset>
          <legend className="text-field-800 text-sm font-semibold">
            I&rsquo;m a
          </legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((option) => {
              const active = gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setGender(option.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-base font-semibold transition ${
                    active
                      ? "border-field-500 bg-field-50 text-field-800 shadow-sm"
                      : "border-field-200 text-field-700/70 hover:border-field-300 hover:bg-field-50/50 bg-white"
                  }`}
                >
                  <span aria-hidden="true">{option.emoji}</span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        {status === "done" && (
          <p
            role="status"
            className="bg-field-50 text-field-800 animate-pop-in rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            You&rsquo;re in! See you Tuesday. ⚾
          </p>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="from-field-500 to-field-600 shadow-field-600/25 hover:to-field-700 focus-visible:ring-field-400/50 w-full rounded-xl bg-gradient-to-b px-4 py-3.5 text-base font-bold text-white shadow-lg transition focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Signing up…" : "Sign me up"}
        </button>
      </div>
    </form>
  );
}
