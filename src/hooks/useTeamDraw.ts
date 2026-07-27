"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { TeamDraw } from "@/lib/types";

/**
 * The published draw for a given week, kept live.
 *
 * RLS only returns rows where published = true, so an unpublished draw simply
 * reads back as null here — the browser cannot see it at all.
 */
export function useTeamDraw(weekId: string | null) {
  const [draw, setDraw] = useState<TeamDraw | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (week: string) => {
    const { data } = await supabase
      .from("team_draws")
      .select("week_id, teams, drawn_at, published, published_at")
      .eq("week_id", week)
      .maybeSingle();
    setDraw((data as TeamDraw | null) ?? null);
  }, []);

  useEffect(() => {
    if (!weekId) return;
    let active = true;

    setLoading(true);
    setDraw(null);
    refresh(weekId).finally(() => {
      if (active) setLoading(false);
    });

    const channel = supabase
      .channel(`team-draws-${weekId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_draws",
          filter: `week_id=eq.${weekId}`,
        },
        () => void refresh(weekId),
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

  return { draw, loading, reload };
}
