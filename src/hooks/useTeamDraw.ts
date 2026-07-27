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
    // `select("*")` for the same reason as useSignups: naming a column that
    // does not exist yet 400s the whole query, so a deploy landing ahead of its
    // migration would break the page rather than simply showing no draw.
    const { data } = await supabase
      .from("team_draws")
      .select("*")
      .eq("week_id", week)
      .maybeSingle();

    setDraw(
      data
        ? {
            ...(data as TeamDraw),
            score_a: (data as Partial<TeamDraw>).score_a ?? null,
            score_b: (data as Partial<TeamDraw>).score_b ?? null,
          }
        : null,
    );
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
