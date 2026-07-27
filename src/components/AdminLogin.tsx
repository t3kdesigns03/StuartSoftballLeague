"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Header } from "@/components/Header";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setBusy(false);
    if (!response.ok) {
      setError("Incorrect password.");
      setPassword("");
      return;
    }
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <Header subtitle="Commissioner access" />

      <form
        onSubmit={handleSubmit}
        className="border-field-100 shadow-field-900/5 mt-8 rounded-3xl border bg-white/85 p-6 shadow-lg backdrop-blur sm:p-7"
      >
        <label
          htmlFor="password"
          className="text-field-800 block text-sm font-semibold"
        >
          Admin password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-field-200 focus:border-field-500 focus:ring-field-400/40 mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-base outline-none transition focus:ring-4"
        />

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="from-field-500 to-field-600 shadow-field-600/25 hover:to-field-700 mt-5 w-full rounded-xl bg-gradient-to-b px-4 py-3.5 text-base font-bold text-white shadow-lg transition disabled:opacity-60"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
