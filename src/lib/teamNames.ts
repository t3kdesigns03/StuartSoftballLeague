import type { Rand } from "@/lib/teams";

/**
 * Weekly team names. Local, no API — an adjective and a noun, both leaning
 * hard into small-town-Iowa sandlot absurdity.
 *
 * 40 x 40 gives ~1600 combinations, so the same pairing rarely repeats. The
 * generator is seedable, which matters once a draw is locked: every visitor
 * has to see the same two names, not just the same two rosters.
 */

const ADJECTIVES = [
  "Sabertooth",
  "Feral",
  "Cosmic",
  "Nuclear",
  "Rabid",
  "Interstellar",
  "Unhinged",
  "Sunburnt",
  "Radioactive",
  "Bewildered",
  "Turbo",
  "Haunted",
  "Greased",
  "Vengeful",
  "Bootleg",
  "Suspicious",
  "Elite",
  "Sleep-Deprived",
  "Unlicensed",
  "Feathered",
  "Galactic",
  "Corn-Fed",
  "Undefeated",
  "Barefoot",
  "Thunderous",
  "Discount",
  "Renegade",
  "Sticky",
  "Immortal",
  "Confused",
  "Prairie",
  "Chrome",
  "Screaming",
  "Off-Brand",
  "Wayward",
  "Deputized",
  "Overserved",
  "Gravel-Road",
  "Midnight",
  "Two-Beer",
];

const NOUNS = [
  "Squirrels",
  "Raccoons",
  "Aliens",
  "Combines",
  "Possums",
  "Meteors",
  "Silo Rats",
  "Tractors",
  "Barn Cats",
  "Comets",
  "Coyotes",
  "Bandits",
  "Hay Bales",
  "Groundhogs",
  "Moon Cows",
  "Crop Dusters",
  "Badgers",
  "Cornstalks",
  "Jackrabbits",
  "Pickup Trucks",
  "Fireflies",
  "Snapping Turtles",
  "Grain Bins",
  "Tumbleweeds",
  "Wind Turbines",
  "Bullfrogs",
  "Scarecrows",
  "Catfish",
  "Chicken Hawks",
  "Gophers",
  "Weathervanes",
  "Nightcrawlers",
  "Dust Devils",
  "Mailboxes",
  "Lawn Chairs",
  "Cicadas",
  "Blue Herons",
  "Feed Sacks",
  "Porch Lights",
  "Gravel Trucks",
];

export type TeamNamePair = [string, string];

/**
 * Two distinct names. The second noun is forced to differ from the first so you
 * never get "Feral Squirrels vs Cosmic Squirrels".
 */
export function pickTeamNames(rand: Rand = Math.random): TeamNamePair {
  const a1 = Math.floor(rand() * ADJECTIVES.length);
  const n1 = Math.floor(rand() * NOUNS.length);

  let a2 = Math.floor(rand() * ADJECTIVES.length);
  let n2 = Math.floor(rand() * NOUNS.length);
  if (a2 === a1) a2 = (a2 + 1 + Math.floor(rand() * 3)) % ADJECTIVES.length;
  if (n2 === n1) n2 = (n2 + 1 + Math.floor(rand() * 3)) % NOUNS.length;

  return [
    `${ADJECTIVES[a1]} ${NOUNS[n1]}`,
    `${ADJECTIVES[a2]} ${NOUNS[n2]}`,
  ];
}

export const TEAM_NAME_COMBINATIONS = ADJECTIVES.length * NOUNS.length;
