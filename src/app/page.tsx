"use client";

import { DrawCountdown } from "@/components/DrawCountdown";
import { FinalDraw } from "@/components/FinalDraw";
import { Header } from "@/components/Header";
import { SignupForm } from "@/components/SignupForm";
import { SignupList } from "@/components/SignupList";
import { SiteFooter } from "@/components/SiteFooter";
import { useSignups } from "@/hooks/useSignups";
import { useTeamDraw } from "@/hooks/useTeamDraw";

export default function HomePage() {
  const { weekId, signups, loading, error, reload } = useSignups();
  const { draw } = useTeamDraw(weekId);

  const published = Boolean(draw?.published);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Header />

      {/*
        Once teams are up they lead the page — that's what people came for.
        Until then, the countdown holds that spot.
      */}
      <div className="mt-10">
        {published ? (
          <FinalDraw draw={draw} />
        ) : (
          <DrawCountdown checkedIn={signups.length} />
        )}
      </div>

      <div
        className={`grid gap-5 sm:gap-6 md:grid-cols-2 md:items-start ${
          published ? "mt-12" : "mt-6"
        }`}
      >
        <SignupForm weekId={weekId} onSignedUp={reload} />
        <SignupList signups={signups} loading={loading} error={error} />
      </div>

      <SiteFooter showAdmin />
    </main>
  );
}
