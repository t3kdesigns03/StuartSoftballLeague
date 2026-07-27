"use client";

import Link from "next/link";

import { Header } from "@/components/Header";
import { SignupForm } from "@/components/SignupForm";
import { SignupList } from "@/components/SignupList";
import { useSignups } from "@/hooks/useSignups";

export default function HomePage() {
  const { weekId, signups, loading, error, reload } = useSignups();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Header />

      <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2 md:items-start">
        <SignupForm weekId={weekId} onSignedUp={reload} />
        <SignupList signups={signups} loading={loading} error={error} />
      </div>

      <footer className="mt-14 text-center">
        <p className="text-starlight-faint text-xs font-bold tracking-[0.2em] uppercase">
          Teams are drawn Monday nights · Play ball Tuesday
        </p>
        <Link
          href="/admin"
          className="text-neon-purple/80 hover:text-neon-cyan mt-3 inline-block text-xs font-black tracking-[0.28em] uppercase transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]"
        >
          <span className="border-b border-current pb-0.5">Admin</span>
        </Link>
      </footer>
    </main>
  );
}
