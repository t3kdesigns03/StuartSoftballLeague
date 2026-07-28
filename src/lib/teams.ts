import type { Gender, Signup, Team } from "@/lib/types";

/**
 * Source of randomness. Injectable so a draw can be reproduced exactly.
 *
 * The public preview reshuffles with `Math.random`, which is fine because it is
 * explicitly a preview. A *locked* draw must be identical for every visitor, so
 * it is generated with a seeded RNG derived from the week and the roster —
 * otherwise each browser would freeze a different set of teams and call it
 * official.
 */
export type Rand = () => number;

/** Deterministic PRNG (mulberry32). Same seed, same sequence, every time. */
export function seededRand(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string, for turning a week id into a seed. */
export function hashSeed(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Fisher-Yates shuffle. Returns a new array; does not mutate the input.
 */
export function shuffle<T>(items: readonly T[], rand: Rand = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const key = (name: string) => name.trim().toLowerCase();

/**
 * A unit that must be dealt to one team as a block: either a single player, or
 * a couple who asked to stay together.
 */
type Unit = {
  players: Signup[];
  guys: number;
  girls: number;
};

/**
 * Group the week's check-ins into dealable units.
 *
 * A pair forms when **both** people named each other. One-sided requests are
 * ignored — if Alex says "Jamie" but Jamie names nobody (or names someone
 * else), Alex is dealt as a single. Requiring mutual consent avoids one person
 * dragging another onto a team, and avoids chains where A→B and B→C would
 * otherwise glue three or more people together.
 */
export function buildUnits(signups: readonly Signup[]): Unit[] {
  const byName = new Map<string, Signup>();
  for (const s of signups) byName.set(key(s.name), s);

  const paired = new Set<string>();
  const units: Unit[] = [];

  for (const person of signups) {
    const me = key(person.name);
    if (paired.has(me)) continue;
    if (!person.partner_name) continue;

    const other = byName.get(key(person.partner_name));
    if (!other || paired.has(key(other.name))) continue;
    if (key(other.name) === me) continue;

    // Mutual? The other person must name us back.
    if (!other.partner_name || key(other.partner_name) !== me) continue;

    paired.add(me);
    paired.add(key(other.name));
    units.push(makeUnit([person, other]));
  }

  for (const person of signups) {
    if (paired.has(key(person.name))) continue;
    units.push(makeUnit([person]));
  }

  return units;
}

function makeUnit(players: Signup[]): Unit {
  return {
    players,
    guys: players.filter((p) => p.gender === "guy").length,
    girls: players.filter((p) => p.gender === "girl").length,
  };
}

/** How lopsided a draw came out — surfaced so the admin can re-draw. */
export type DrawBalance = {
  sizeGap: number;
  guyGap: number;
  girlGap: number;
  /** True when pairing forced a split worse than the usual within-one. */
  lopsided: boolean;
  pairsKept: number;
};

/**
 * Split the week's check-ins into exactly two teams.
 *
 * Couples who asked to stay together are never split — that is the promise on
 * the flyer — so they are dealt as blocks first, largest first, each going to
 * whichever side is currently lighter. Singles are then dealt by gender to
 * even things out, which is what recovers the balance pairs may have skewed.
 *
 * With only single players this reduces to the original behaviour: teams even
 * within one player, and each gender even within one.
 *
 * Returns null if there are fewer than 2 players.
 */
export function generateTeams(
  signups: readonly Signup[],
  rand: Rand = Math.random,
): [Team, Team] | null {
  if (signups.length < 2) return null;

  const rosters: [Signup[], Signup[]] = [[], []];
  const units = buildUnits(signups);
  const pairs = units.filter((u) => u.players.length > 1);
  const singles = units.filter((u) => u.players.length === 1);

  // --- couples first, biggest imbalance first, to the lighter side ----------
  for (const unit of shuffle(pairs, rand)) {
    const side = rosters[0].length <= rosters[1].length ? 0 : 1;
    rosters[side].push(...unit.players);
  }

  // --- then singles, per gender, to whichever side has fewer of that gender -
  for (const gender of ["guy", "girl"] as const) {
    const pool = shuffle(
      singles.filter((u) => u.players[0].gender === gender).map((u) => u.players[0]),
      rand,
    );
    for (const player of pool) {
      const a = rosters[0].filter((p) => p.gender === gender).length;
      const b = rosters[1].filter((p) => p.gender === gender).length;
      let side: 0 | 1;
      if (a !== b) {
        side = a < b ? 0 : 1;
      } else if (rosters[0].length !== rosters[1].length) {
        side = rosters[0].length < rosters[1].length ? 0 : 1;
      } else {
        side = rand() < 0.5 ? 0 : 1;
      }
      rosters[side].push(player);
    }
  }

  // A team can only be empty if every unit landed on one side — possible with
  // a single couple and nobody else. Move one player across so there is a game.
  if (rosters[0].length === 0) rosters[0].push(rosters[1].pop() as Signup);
  if (rosters[1].length === 0) rosters[1].push(rosters[0].pop() as Signup);

  return [
    buildTeam("Team Green", "green", rosters[0], rand),
    buildTeam("Team Gold", "yellow", rosters[1], rand),
  ];
}

export function countByGender(players: readonly Signup[]) {
  const guys = players.filter((p) => p.gender === "guy").length;
  return { guys, girls: players.length - guys };
}

/** Describe how even a finished draw is. */
export function describeBalance(
  teams: [Team, Team],
  signups: readonly Signup[],
): DrawBalance {
  const [a, b] = teams;
  const g = (t: Team, gender: Gender) =>
    t.players.filter((p) => p.gender === gender).length;

  const sizeGap = Math.abs(a.players.length - b.players.length);
  const guyGap = Math.abs(g(a, "guy") - g(b, "guy"));
  const girlGap = Math.abs(g(a, "girl") - g(b, "girl"));

  return {
    sizeGap,
    guyGap,
    girlGap,
    lopsided: sizeGap > 1 || guyGap > 1 || girlGap > 1,
    pairsKept: buildUnits(signups).filter((u) => u.players.length > 1).length,
  };
}

function buildTeam(
  name: string,
  color: Team["color"],
  players: Signup[],
  rand: Rand = Math.random,
): Team {
  const captain = players[Math.floor(rand() * players.length)];
  return {
    name,
    color,
    captain,
    battingOrder: battingOrder(players, rand),
    // Captain first, then everyone else alphabetically.
    players: [
      captain,
      ...players
        .filter((p) => p.id !== captain.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ],
  };
}

/**
 * Suggested batting order: alternate guy/girl as much as the roster allows.
 *
 * League rule 11 asks the order to alternate "as much as possible". When one
 * gender outnumbers the other you cannot alternate the whole way, so the
 * minority gender is spread as evenly as possible through the majority — that
 * is the arrangement with the fewest same-gender neighbours available. With
 * 7 guys and 3 girls you get G-B-B-G-B-B-G-B-B-B rather than all three girls
 * bunched at one end.
 */
export function battingOrder(
  players: readonly Signup[],
  rand: Rand = Math.random,
): Signup[] {
  const guys = shuffle(players.filter((p) => p.gender === "guy"), rand);
  const girls = shuffle(players.filter((p) => p.gender === "girl"), rand);

  const [majority, minority] =
    guys.length >= girls.length ? [guys, girls] : [girls, guys];

  if (minority.length === 0) return majority;

  // Drop the minority into evenly spaced slots among the majority.
  const order: Signup[] = [];
  const gaps = minority.length + 1;
  const base = Math.floor(majority.length / gaps);
  let extra = majority.length % gaps;

  let m = 0;
  for (let i = 0; i < minority.length; i++) {
    const take = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    for (let k = 0; k < take; k++) order.push(majority[m++]);
    order.push(minority[i]);
  }
  while (m < majority.length) order.push(majority[m++]);

  return order;
}
