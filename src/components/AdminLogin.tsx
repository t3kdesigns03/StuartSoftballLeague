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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-14 sm:px-6">
      <Header subtitle="Commissioner access" />

      <form
        onSubmit={handleSubmit}
        className="glass-panel glass-panel-hover rounded-blob mt-9 p-6 sm:p-7"
      >
        <label
          htmlFor="password"
          className="text-starlight-dim block text-xs font-bold tracking-[0.2em] uppercase"
        >
          Admin password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-starlight focus:border-neon-purple/70 focus:shadow-[0_0_0_4px_rgba(176,0,255,0.16),0_0_28px_-8px_rgba(176,0,255,0.9)] mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3.5 text-base outline-none transition duration-300"
        />

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl px-4 py-4 text-base font-black tracking-[0.14em] text-white uppercase transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-45"
          style={{
            background: "linear-gradient(100deg, #b000ff 0%, #ff00aa 100%)",
            boxShadow:
              "0 0 34px -8px rgba(176,0,255,0.9), 0 10px 30px -12px rgba(255,0,170,0.75)",
          }}
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
