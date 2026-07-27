import type { Metadata } from "next";

import { ContentPage, ContentSection } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "How the draft works · Stuart Softball League '26",
  description:
    "Red rover draft, every week. Check in by Tuesday noon, teams are drawn fresh, and you'll know your lineup before first pitch.",
};

const STEPS = [
  {
    n: "01",
    title: "Check in each week",
    body: "Add your name on the main page any time before Tuesday at noon. Every week is its own check-in — being on the roster doesn't automatically put you in a game, so tell us you're coming.",
  },
  {
    n: "02",
    title: "Teams are drawn fresh",
    body: "Red rover style: at the cutoff we shuffle everyone who checked in and deal two brand-new teams. Nothing carries over from last week. Whoever you played with on Tuesday, you probably won't next Tuesday.",
  },
  {
    n: "03",
    title: "Balanced by gender and size",
    body: "The draw deals guys and girls separately and alternates sides, so both teams land within a player of each other on total size and on each gender. Nobody stacks a roster — the shuffle doesn't know who's good.",
  },
  {
    n: "04",
    title: "Couples stay together",
    body: "Tick the box when you check in and name your partner. As long as they check in too and name you back, you're dealt to the same team as a block. Pairs are never split, even when it makes the teams slightly uneven — that's the trade we make.",
  },
  {
    n: "05",
    title: "A captain is picked at random",
    body: "One player on each team is drawn as captain. It's luck of the draw, not seniority. Captains keep the book, handle the lineup, and are responsible for their team's conduct.",
  },
  {
    n: "06",
    title: "Batting order comes with it",
    body: "Each team gets a suggested lineup that alternates guy/girl as far as the roster allows — league rule. When one gender outnumbers the other, the smaller group is spread as evenly as possible instead of bunched at one end.",
  },
];

export default function HowItWorksPage() {
  return (
    <ContentPage
      eyebrow="Coed sandlot Tuesdays"
      title="How the draft works"
      intro="No permanent teams, no stacked rosters, no politics. Show up, get shuffled, play ball."
    >
      {STEPS.map((step) => (
        <section
          key={step.n}
          className="glass-panel glass-panel-hover rounded-blob p-5 sm:p-6"
        >
          <div className="flex gap-4">
            <span className="text-glow-title shrink-0 text-2xl font-black tabular-nums sm:text-3xl">
              {step.n}
            </span>
            <div>
              <h2 className="text-starlight text-base font-extrabold tracking-wide uppercase sm:text-lg">
                {step.title}
              </h2>
              <p className="text-starlight-dim mt-2 text-sm leading-relaxed">
                {step.body}
              </p>
            </div>
          </div>
        </section>
      ))}

      <ContentSection title="Fresh teams, every single week">
        <p>
          That&rsquo;s the whole point of red rover. You&rsquo;ll play with
          people you&rsquo;ve never played with, against people you were on a
          team with last week. It keeps the league friendly and it means one
          strong roster can&rsquo;t run away with the season.
        </p>
        <p>
          Missed the cutoff? Add your name anyway and talk to the commissioner —
          we sort out stragglers at the field.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
