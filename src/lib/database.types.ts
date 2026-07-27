import type { Gender } from "@/lib/types";

/**
 * Minimal hand-written typing for the `signups` table.
 *
 * If the schema grows, regenerate this with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */
export type Database = {
  public: {
    Tables: {
      signups: {
        Row: {
          id: string;
          name: string;
          gender: Gender;
          created_at: string;
          week_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          gender: Gender;
          created_at?: string;
          week_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          gender?: Gender;
          created_at?: string;
          week_id?: string;
        };
        Relationships: [];
      };
      league_state: {
        Row: { id: number; current_week_id: string; updated_at: string };
        Insert: { id?: number; current_week_id: string; updated_at?: string };
        Update: { id?: number; current_week_id?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
