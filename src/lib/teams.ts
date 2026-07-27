import type { Signup, Team } from "@/lib/types";

/**
 * Fisher-Yates shuffle. Returns a new array; does not mutate the input.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Split signups into exactly two gender-balanced teams.
 *
 * 1. Separate guys and girls
 * 2. Shuffle each list independently
 * 3. Deal alternately into Team A / Team B
 * 4. Pick a random captain on each team
 *
 * Dealing each gender separately keeps the guy/girl split even (within one
 * player). To also keep the *total* roster sizes even, the deal carries its
 * parity from one gender to the next: if the guys list is odd and Team A takes
 * the extra guy, the girls deal starts on Team B so the extra girl balances it
 * out. Without that carry-over, two odd lists could both favour the same side
 * and leave the teams two players apart.
 *
 * The very first side is chosen at random so Team A is not systematically
 * favoured.
 *
 * Returns null if there are fewer than 2 players — you cannot field two teams.
 */
export function generateTeams(signups: readonly Signup[]): [Team, Team] | null {
  if (signups.length < 2) return null;

  const rosters: [Signup[], Signup[]] = [[], []];
  let offset = Math.random() < 0.5 ? 0 : 1;

  for (const gender of ["guy", "girl"] as const) {
    const pool = shuffle(signups.filter((s) => s.gender === gender));
    pool.forEach((player, index) => {
      rosters[(index + offset) % 2].push(player);
    });
    // Carry the parity forward so an odd pool flips the next pool's start.
    offset = (offset + pool.length) % 2;
  }

  // Guard against a lopsided edge case: if one side ended up empty (e.g. two
  // players of different genders both dealt to the same side), move one over.
  if (rosters[0].length === 0) rosters[0].push(rosters[1].pop() as Signup);
  if (rosters[1].length === 0) rosters[1].push(rosters[0].pop() as Signup);

  return [
    buildTeam("Team Green", "green", rosters[0]),
    buildTeam("Team Gold", "yellow", rosters[1]),
  ];
}

function buildTeam(name: string, color: Team["color"], players: Signup[]): Team {
  const captain = players[Math.floor(Math.random() * players.length)];
  return {
    name,
    color,
    captain,
    // Captain first, then everyone else alphabetically.
    players: [
      captain,
      ...players
        .filter((p) => p.id !== captain.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ],
  };
}

export function countByGender(players: readonly Signup[]) {
  return {
    guys: players.filter((p) => p.gender === "guy").length,
    girls: players.filter((p) => p.gender === "girl").length,
  };
}
