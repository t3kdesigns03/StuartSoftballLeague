"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Signup } from "@/lib/types";
import { getCurrentWeekId } from "@/lib/week";

/**
 * Loads the current week's signups and keeps them live via Supabase realtime.
 *
 * Also watches league_state, so when the admin starts a new week every open
 * browser switches to the new (empty) list without needing a refresh.
 */
export function useSignups() {
  const [weekId, setWeekId] = useState<string | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (week: string) => {
    // Read through the view: it joins names on for us without exposing the
    // roster table (and therefore without exposing payment status).
    const { data, error: fetchError } = await supabase
      .from("signups_public")
      .select("id, player_id, name, gender, week_id, created_at, partner_name")
      .eq("week_id", week)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError("Could not load this week's signups.");
      return;
    }
    setError(null);
    setSignups((data ?? []) as Signup[]);
  }, []);

  // Resolve the current week, then watch for the admin rolling it over.
  useEffect(() => {
    let active = true;

    getCurrentWeekId()
      .then((week) => {
        if (active) setWeekId(week);
      })
      .catch(() => {
        if (active) {
          setError("Could not reach the league database.");
          setLoading(false);
        }
      });

    const channel = supabase
      .channel("league-state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "league_state" },
        (payload) => {
          const next = (payload.new as { current_week_id?: string })
            .current_week_id;
          if (next) {
            setSignups([]);
            setWeekId(next);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Load + subscribe to signups for whichever week is active.
  useEffect(() => {
    if (!weekId) return;
    let active = true;

    setLoading(true);
    refresh(weekId).finally(() => {
      if (active) setLoading(false);
    });

    const channel = supabase
      .channel(`signups-${weekId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signups",
          filter: `week_id=eq.${weekId}`,
        },
        () => {
          void refresh(weekId);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [weekId, refresh]);

  const reload = useCallback(() => {
    if (weekId) void refresh(weekId);
  }, [weekId, refresh]);

  return { weekId, setWeekId, signups, loading, error, reload };
}
