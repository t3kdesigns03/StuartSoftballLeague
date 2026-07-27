import type { Metadata } from "next";

import { ContentPage, ContentSection } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Player waiver · Stuart Softball League '26",
  description:
    "Assumption of risk, release of liability and medical authorization for Stuart Softball League '26 participants.",
};

export default function WaiverPage() {
  return (
    <ContentPage
      eyebrow="Read before you play"
      title="Player waiver"
      intro="Adult recreational softball carries real risk of injury. Please read this in full — every participant must agree to it before taking the field."
    >
      <ContentSection title="1. Assumption of risk">
        <p>
          I understand that slow-pitch softball is a physical, contact-possible
          recreational activity, and that participating carries inherent risks
          that cannot be eliminated regardless of care taken. Those risks
          include, without limitation: being struck by a batted, thrown or
          pitched ball or a bat; collisions with other players, fences, bases or
          equipment; sprains, strains, fractures, concussion and other head,
          neck or spinal injury; heat illness, dehydration, lightning and other
          weather exposure; uneven or wet field conditions; and in rare cases
          permanent disability or death.
        </p>
        <p>
          I am voluntarily choosing to participate with full knowledge of these
          risks, and I accept them as my own.
        </p>
      </ContentSection>

      <ContentSection title="2. Fitness to participate">
        <p>
          I confirm I am 18 years of age or older. I represent that I am in
          sufficient physical condition to participate, that I am not aware of
          any medical condition that would make participation unsafe for me or
          for others, and that I have been advised to consult a physician before
          beginning any athletic activity. I accept responsibility for judging
          my own fitness to play on any given night, and I will remove myself
          from play if I am injured or unwell.
        </p>
      </ContentSection>

      <ContentSection title="3. Release of liability">
        <p>
          In consideration of being permitted to participate, I release, waive
          and discharge the Stuart Softball League, its commissioner, organizers,
          volunteers, captains, sponsors and other participants, together with
          the City of Stuart, the Stuart Sports Complex, Jim Kloewer Field, and
          their respective officials, employees and agents (collectively, the
          &ldquo;Released Parties&rdquo;), from any and all claims, demands,
          damages or causes of action arising out of or related to my
          participation, including any loss or damage to personal property.
        </p>
        <p>
          This release applies to claims arising from the ordinary negligence of
          the Released Parties. It does not apply to gross negligence, recklessness
          or intentional misconduct, and it does not waive any right that cannot be
          waived under applicable law.
        </p>
      </ContentSection>

      <ContentSection title="4. Medical authorization">
        <p>
          I authorize the league and its representatives to arrange emergency
          medical treatment on my behalf if I am injured and unable to consent,
          including transport by ambulance. I understand this is an authorization
          only — the league does not provide medical care, and I am responsible
          for all costs of any treatment, transport or hospitalization.
        </p>
        <p>
          I confirm that I am responsible for my own health, accident and
          liability insurance. The league does not carry medical insurance
          covering participants.
        </p>
      </ContentSection>

      <ContentSection title="5. Conduct and league rules">
        <p>
          I agree to abide by the{" "}
          <a
            href="/rules"
            className="text-neon-cyan font-bold underline underline-offset-4"
          >
            league rules
          </a>{" "}
          and by the decisions of umpires and the commissioner. I understand
          that unsportsmanlike conduct, alcohol use during games, or disregard
          for player-safety rules such as the slide rule may result in ejection
          or removal from the league without refund.
        </p>
      </ContentSection>

      <ContentSection title="6. Photography">
        <p>
          I grant permission for photographs or video taken at league games in
          which I appear to be used for league communications and promotion,
          without compensation. If you would rather not appear, tell the
          commissioner and we will respect it.
        </p>
      </ContentSection>

      <ContentSection title="7. Agreement">
        <p>
          I have read this waiver and release, I understand it, and I sign it
          voluntarily. I understand it is a release of legal rights and that it
          binds me, my heirs and my personal representatives. If any part of it
          is found unenforceable, the remainder stays in effect.
        </p>
        <p>
          By checking in to play, I acknowledge and accept these terms for the
          Stuart Softball League &rsquo;26 season.
        </p>
      </ContentSection>

      <section className="rounded-blob border-2 border-white/10 bg-black/25 p-5 sm:p-6">
        <h2 className="text-starlight-dim text-xs font-black tracking-[0.18em] uppercase">
          A note from the league
        </h2>
        <p className="text-starlight-faint mt-2 text-xs leading-relaxed">
          This waiver was written for a recreational adult league and has not
          been reviewed by an attorney. Enforceability of liability releases
          varies by state, and a release involving city-owned property may need
          specific language the city requires. Before relying on it, have it
          reviewed by a lawyer and confirm with the City of Stuart whether they
          require their own form as well.
        </p>
      </section>
    </ContentPage>
  );
}
