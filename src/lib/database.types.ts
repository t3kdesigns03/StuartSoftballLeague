import type { BonusPool, Gender, PublishedTeam } from "@/lib/types";

/**
 * Hand-written typing for the tables and views this app touches.
 *
 * If the schema grows, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */
export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          gender: Gender;
          paid: boolean;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          gender: Gender;
          paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          gender?: Gender;
          paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      signups: {
        Row: {
          id: string;
          player_id: string;
          week_id: string;
          created_at: string;
          partner_name: string | null;
        };
        Insert: {
          id?: string;
          player_id: string;
          week_id: string;
          created_at?: string;
          partner_name?: string | null;
        };
        Update: {
          id?: string;
          player_id?: string;
          week_id?: string;
          created_at?: string;
          partner_name?: string | null;
        };
        Relationships: [];
      };
      league_state: {
        Row: {
          id: number;
          current_week_id: string;
          updated_at: string;
          bonus_ball_enabled: boolean;
        };
        Insert: {
          id?: number;
          current_week_id: string;
          updated_at?: string;
          bonus_ball_enabled?: boolean;
        };
        Update: {
          id?: number;
          current_week_id?: string;
          updated_at?: string;
          bonus_ball_enabled?: boolean;
        };
        Relationships: [];
      };
      bonus_entries: {
        Row: {
          id: string;
          player_id: string;
          week_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          week_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          week_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      team_draws: {
        Row: {
          week_id: string;
          teams: PublishedTeam[];
          drawn_at: string;
          published: boolean;
          published_at: string | null;
          score_a: number | null;
          score_b: number | null;
        };
        Insert: {
          week_id: string;
          teams: PublishedTeam[];
          drawn_at?: string;
          published?: boolean;
          published_at?: string | null;
          score_a?: number | null;
          score_b?: number | null;
        };
        Update: {
          week_id?: string;
          teams?: PublishedTeam[];
          drawn_at?: string;
          published?: boolean;
          published_at?: string | null;
          score_a?: number | null;
          score_b?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      /** signups joined to players — names without exposing payment status. */
      signups_public: {
        Row: {
          id: string;
          week_id: string;
          created_at: string;
          player_id: string;
          partner_name: string | null;
          name: string;
          gender: Gender;
        };
        Relationships: [];
      };
    };
    Functions: {
      /** Find-or-create the player, then record their check-in for the open week. */
      check_in: {
        Args: { p_name: string; p_gender: Gender; p_partner?: string | null };
        Returns: undefined;
      };
      /** Opt into the current week's $5 bonus-ball pool (idempotent, flag-gated). */
      enter_bonus_ball: {
        Args: { p_name: string; p_gender: Gender };
        Returns: undefined;
      };
      /** Participant-only view of the current week's pool. See BonusPool. */
      bonus_pool: {
        Args: { p_name: string };
        Returns: BonusPool;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
