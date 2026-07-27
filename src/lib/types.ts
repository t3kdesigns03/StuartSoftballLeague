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
};

export type Team = {
  name: string;
  color: "green" | "yellow";
  captain: Signup;
  players: Signup[];
};

export const GENDER_LABELS: Record<Gender, string> = {
  guy: "Guy",
  girl: "Girl",
};

/** One-time season fee, in whole dollars. From the flyer. */
export const SEASON_FEE = 20;

/**
 * A team as stored in team_draws.teams — a snapshot, names included, so the
 * public page can render it without any access to the roster table.
 */
export type PublishedTeam = {
  name: string;
  color: Team["color"];
  captain_id: string;
  players: { id: string; name: string; gender: Gender }[];
};

/** The published draw for one week. The "final say". */
export type TeamDraw = {
  week_id: string;
  teams: [PublishedTeam, PublishedTeam];
  drawn_at: string;
  published: boolean;
  published_at: string | null;
};

/** Convert an in-memory draw into the snapshot shape we persist. */
export function toPublishedTeams(
  teams: [Team, Team],
): [PublishedTeam, PublishedTeam] {
  return teams.map((team) => ({
    name: team.name,
    color: team.color,
    captain_id: team.captain.player_id,
    players: team.players.map((p) => ({
      id: p.player_id,
      name: p.name,
      gender: p.gender,
    })),
  })) as [PublishedTeam, PublishedTeam];
}
