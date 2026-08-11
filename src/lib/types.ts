export type Gender = "guy" | "girl";

/** A permanent roster entry. One row per human, ever. */
export type Player = {
  id: string;
  name: string;
  gender: Gender;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  /** Weeks this player has checked in for. Added by the admin roster route. */
  weeks_played?: number;
};

/** A weekly check-in, joined to the player it belongs to. */
export type Signup = {
  id: string;
  player_id: string;
  name: string;
  gender: Gender;
  created_at: string;
  week_id: string;
  /** Optional. Who this person asked to be teamed with, as typed this week. */
  partner_name: string | null;
};

export type Team = {
  name: string;
  color: "green" | "yellow";
  captain: Signup;
  players: Signup[];
  /** Suggested lineup, alternating gender as far as the roster allows. */
  battingOrder: Signup[];
};

export const GENDER_LABELS: Record<Gender, string> = {
  guy: "Guy",
  girl: "Girl",
};

/** One-time season fee, in whole dollars. From the flyer. */
export const SEASON_FEE = 20;

/** Flat entry for the voluntary weekly Bonus Ball pool, in whole dollars. */
export const BONUS_ENTRY_FEE = 5;

/**
 * The shape bonus_pool() returns. When the feature is on, the count, total and
 * names are public — everyone gets them. `member` only reports whether the name
 * passed is one of the entrants, so the UI can show a "you're in" badge; it no
 * longer gates what comes back.
 */
export type BonusPool =
  | { enabled: false }
  | {
      enabled: true;
      member: boolean;
      count: number;
      total_cents: number;
      names: string[];
    };

/**
 * A team as stored in team_draws.teams — a snapshot, names included, so the
 * public page can render it without any access to the roster table.
 */
export type PublishedTeam = {
  name: string;
  color: Team["color"];
  captain_id: string;
  players: { id: string; name: string; gender: Gender }[];
  /** Player ids in batting order. Absent on draws published before this feature. */
  batting_order?: string[];
  /** Which dugout. Absent on draws published before this feature. */
  home?: boolean;
};

/** The published draw for one week. The "final say". */
export type TeamDraw = {
  week_id: string;
  teams: [PublishedTeam, PublishedTeam];
  drawn_at: string;
  published: boolean;
  published_at: string | null;
  score_a: number | null;
  score_b: number | null;
};

/** Convert an in-memory draw into the snapshot shape we persist. */
export function toPublishedTeams(
  teams: [Team, Team],
  homeIndex: 0 | 1 = Math.random() < 0.5 ? 0 : 1,
): [PublishedTeam, PublishedTeam] {
  return teams.map((team, index) => ({
    name: team.name,
    color: team.color,
    captain_id: team.captain.player_id,
    players: team.players.map((p) => ({
      id: p.player_id,
      name: p.name,
      gender: p.gender,
    })),
    batting_order: team.battingOrder.map((p) => p.player_id),
    home: index === homeIndex,
  })) as [PublishedTeam, PublishedTeam];
}
