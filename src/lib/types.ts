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
