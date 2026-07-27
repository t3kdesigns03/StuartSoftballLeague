export type Gender = "guy" | "girl";

export type Signup = {
  id: string;
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
