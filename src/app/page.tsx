"use client";

import Link from "next/link";

import { Header } from "@/components/Header";
import { SignupForm } from "@/components/SignupForm";
import { SignupList } from "@/components/SignupList";
import { useSignups } from "@/hooks/useSignups";

export default function HomePage() {
  const { weekId, signups, loading, error, reload } = useSignups();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <Header />

      <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 md:grid-cols-2 md:items-start">
        <SignupForm weekId={weekId} onSignedUp={reload} />
        <SignupList signups={signups} loading={loading} error={error} />
      </div>

      <footer className="text-field-700/50 mt-12 text-center text-xs font-medium">
        <p>Teams are drawn Monday nights. Play ball Tuesday. ⚾</p>
        <Link
          href="/admin"
          className="hover:text-field-700 mt-2 inline-block underline underline-offset-4 transition"
        >
          Admin
        </Link>
      </footer>
    </main>
  );
}
