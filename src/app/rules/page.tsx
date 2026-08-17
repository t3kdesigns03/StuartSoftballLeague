import type { Metadata } from "next";

import { ContentPage, ContentSection } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "League rules · Stuart Softball League '26",
  description:
    "Playing rules for the Stuart Softball League '26 coed sandlot season at Jim Kloewer Field.",
};

type Rule = { n: number; title?: string; body: string };

const RULES: Rule[] = [
  {
    n: 1,
    body: "All games are played at Jim Kloewer Field @ Stuart Sports Complex. First pitch is 7:30 PM, with a 15-minute warm up prior to each game.",
  },
  {
    n: 2,
    body: "Teams either playing before or after a game will umpire and provide a person to operate the scoreboard/clock.",
  },
  {
    n: 3,
    body: "Stuart Softball League will provide the game balls and batter mat.",
  },
  {
    n: 4,
    body: "Teams are required to keep their own score. The home team's book will be the official book.",
  },
  {
    n: 5,
    title: "Roster and field alignment",
    body: "10 players play at a time, 11 may bat. The standard lineup is 5 men and 5 women — three of each in the infield and two of each in the outfield, with an opposite-gender battery (male pitcher / female catcher, or female pitcher / male catcher). A team may start a game with 7 players. Late players may be inserted by asking the umpire for time and adding them to the end of the lineup. If a team drops below 7 players because of injury, ejection, or having to leave, the game is a forfeit.",
  },
  {
    n: 6,
    title: "Game time is forfeit time",
    body: "The umpire's watch will be used as the official game time. If your team forfeits a game without notifying the Stuart Softball League Commissioner 24 hours before game time, the game will be counted as a loss on League Standings.",
  },
  {
    n: 7,
    body: "Games will be played with a 60-minute time limit. An official game will be after 4½ innings. If the score is tied after 60 minutes, one additional inning will be played with the batter beginning with a 3-2 count. If neither team can win after the extra inning, the last out of the previous inning will be placed on 2nd base continuing with a 3-2 count. In case a game is called due to rain, 4½ innings make a game. If 4½ innings are not completed the game will be rescheduled.",
  },
  {
    n: 8,
    body: "Two warm up pitches will be allowed between innings. Infield ball or throwing ball around the horn will only be allowed during the first inning.",
  },
  {
    n: 9,
    body: "A starting pitcher may re-enter as a pitcher unless they have been removed for pitching with excessive speed.",
  },
  {
    n: 10,
    body: "The pitch must have a minimum arc of 6 feet from the ground and a maximum arc of 12 feet from the ground, and hit the pitching mat.",
  },
  {
    n: 11,
    title: "Batting order",
    body: "Batting order must alternate male/female as much as possible. The batter starts with a count of 1 ball and 1 strike. When a team must bat 2 consecutive males, an out is recorded each time before the 2nd man bats.",
  },
  {
    n: 12,
    title: "Courtesy foul",
    body: "A batter with two strikes is allowed one courtesy foul. The first foul ball hit with two strikes does not count as a strikeout; a second foul with two strikes is an out.",
  },
  {
    n: 13,
    title: "Walks",
    body: "When a male batter is walked, he advances to second base. With two outs, a walked male advances to second and the following female batter may take first base or bat.",
  },
  {
    n: 14,
    title: "Home runs",
    body: "Each team is allowed two home runs per sex, with a maximum of one home run per sex in any single inning. Any home run beyond that limit is an automatic out.",
  },
  {
    n: 15,
    body: "ASA bats must be used. Men hit a 12″ ball, women hit an 11″ ball.",
  },
  {
    n: 16,
    title: "Reentry rule",
    body: "Any of the starting players may be withdrawn and reentered once, provided players occupy the same batting order.",
  },
  {
    n: 17,
    title: "Mercy rule",
    body: "15-run rule after 5 innings. A time limit of 60 minutes is in effect for each game. No inning begins after the 60-minute time limit.",
  },
  {
    n: 18,
    title: "Slide rule",
    body: "If there is a play at a base you must slide or avoid contact — avoid contact at all times when the defensive player has the ball or is receiving the ball. No running over or crashing into another player. When a defensive player has the ball or is about to catch a thrown ball and the runner remains on his feet and crashes into the defensive player, the runner will be declared out. If the act is determined to be flagrant, the offender shall be ejected.",
  },
  {
    n: 19,
    title: "Injury rule",
    body: "If a player leaves the game injured, that player may not re-enter that game.",
  },
  {
    n: 20,
    body: "The only players allowed on the field while on offense are the base coaches, the on-deck batter, and the batter. It is the responsibility of the manager to keep all other persons from this area. For their safety, please keep children out of the dugout.",
  },
  {
    n: 21,
    body: "Umpires and their decisions will be respected and not interfered with at any time. Any player or manager/captain that is ejected from a game for unsportsmanlike conduct, disrespect, vulgarity, or profanity must leave the park. This decision will be made by the captains or alternate captains.",
  },
  {
    n: 22,
    body: "Each team captain/manager is responsible for the conduct of his/her team players and is responsible to see that all rules are observed.",
  },
  {
    n: 23,
    body: "In case of inclement weather, team captains will be messaged by 4:00 PM, and the team captains will then start a phone tree or e-mail tree to their team members to get the word out about the cancellation.",
  },
  { n: 24, body: "No stealing of bases will be allowed." },
  {
    n: 25,
    body: "The City of Stuart reserves the right to make any changes necessary during the league.",
  },
];

export default function RulesPage() {
  return (
    <ContentPage
      eyebrow="Stuart Softball League '26"
      title="League rules"
      intro="Coed sandlot Fridays at Jim Kloewer Field. Must be 18 years old to play."
    >
      <ContentSection title="Before you read on">
        <p>
          Teams are drafted fresh every week from whoever checked in — see{" "}
          <a
            href="/how-it-works"
            className="text-neon-cyan font-bold underline underline-offset-4"
          >
            how the draft works
          </a>
          . Two teams, two randomly drawn captains, new rosters each Friday.
        </p>
        <p>
          All players must be 18 years or older and have a signed{" "}
          <a
            href="/waiver"
            className="text-neon-cyan font-bold underline underline-offset-4"
          >
            waiver
          </a>{" "}
          on file before taking the field.
        </p>
      </ContentSection>

      <ContentSection title="New for 2026">
        <p>
          A few rules were updated for the 2026 season. The headline changes:
        </p>
        <ul className="mt-1 space-y-2 pl-1">
          <li>
            <span className="text-neon-yellow font-bold">Home runs:</span> two
            per sex per game, max one per sex per inning — anything over is an
            out (rule 14).
          </li>
          <li>
            <span className="text-neon-yellow font-bold">Courtesy foul:</span>{" "}
            one foul is allowed with two strikes before a strikeout (rule 12).
          </li>
          <li>
            <span className="text-neon-yellow font-bold">Walks:</span> a walked
            male takes second base; with two outs the following female may take
            first (rule 13).
          </li>
          <li>
            <span className="text-neon-yellow font-bold">Field alignment:</span>{" "}
            standard 5 men / 5 women with an opposite-gender battery (rule 5).
          </li>
        </ul>
      </ContentSection>

      <section className="glass-panel rounded-blob p-5 sm:p-7">
        <ol className="space-y-5">
          {RULES.map((rule) => (
            <li key={rule.n} className="flex gap-4">
              <span className="text-neon-cyan/70 w-7 shrink-0 text-sm font-black tabular-nums">
                {String(rule.n).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                {rule.title && (
                  <h3 className="text-neon-yellow text-xs font-black tracking-[0.14em] uppercase">
                    {rule.title}
                  </h3>
                )}
                <p
                  className={`text-starlight-dim text-sm leading-relaxed ${rule.title ? "mt-1" : ""}`}
                >
                  {rule.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <ContentSection>
        <p className="text-starlight-faint text-xs">
          Questions about a rule, a forfeit, or a rainout? Talk to the league
          commissioner before game time rather than at the plate.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
