"use client";

import { BonusBallPanel } from "@/components/BonusBallPanel";
import { FinalDraw } from "@/components/FinalDraw";
import { Header } from "@/components/Header";
import { SeasonHistory } from "@/components/SeasonHistory";
import { SignupForm } from "@/components/SignupForm";
import { SignupList } from "@/components/SignupList";
import { SiteFooter } from "@/components/SiteFooter";
import { TeamPreview } from "@/components/TeamPreview";
import { useBonusBall } from "@/hooks/useBonusBall";
import { usePublishedHistory } from "@/hooks/usePublishedHistory";
import { useSignups } from "@/hooks/useSignups";
import { useTeamDraw } from "@/hooks/useTeamDraw";

export default function HomePage() {
  const { weekId, signups, loading, error, reload } = useSignups();
  const { draw } = useTeamDraw(weekId);
  const { draws: history } = usePublishedHistory();
  const bonus = useBonusBall();

  const published = Boolean(draw?.published);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Header />

      {/*
        The commissioner's published draw always wins. Until they publish, the
        interactive preview holds this spot — reshuffling while check-in is
        open, then locking itself to a deterministic draw at the cutoff.
      */}
      <div className="mt-10">
        {published ? (
          <FinalDraw draw={draw} />
        ) : (
          <TeamPreview signups={signups} weekId={weekId} loading={loading} />
        )}
      </div>

      {/*
        Bonus Ball: a mystery teaser to non-entrants, the live pool to entrants.
        Renders nothing at all while the feature flag is off. Sits above the
        signup grid so the CTA and the opt-in it links to read as one flow.
      */}
      <BonusBallPanel bonus={bonus} />

      <div
        className={`grid gap-5 sm:gap-6 md:grid-cols-2 md:items-start ${
          published ? "mt-12" : "mt-6"
        }`}
      >
        <SignupForm
          weekId={weekId}
          signups={signups}
          onSignedUp={reload}
          bonus={bonus}
        />
        <SignupList signups={signups} loading={loading} error={error} />
      </div>

      {/*
        Every past published week, most recent first. The week shown live above
        is excluded so it does not appear twice.
      */}
      <SeasonHistory draws={history} excludeWeekId={published ? weekId : null} />

      <SiteFooter showAdmin />
    </main>
  );
}
