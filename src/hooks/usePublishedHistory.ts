"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { TeamDraw } from "@/lib/types";

/**
 * Every published draw, newest first — the league's running history.
 *
 * RLS only returns rows where published = true, so this is exactly the weeks
 * that have gone live. Rows are never deleted when a week rolls over, so past
 * weeks accumulate here even though the public page's headline only ever shows
 * the current week.
 *
 * Ordering is by when each draw was published (falling back to when it was
 * drawn) rather than by week_id: a second reset inside one calendar week gives
 * a week_id a timestamp suffix, so plain string order is not chronological.
 *
 * `select("*")` for the same reason as useTeamDraw/useSignups: naming a column
 * the table does not have yet 400s the whole query, so a deploy landing ahead
 * of its migration would blank the list rather than degrade gracefully.
 */
export function usePublishedHistory() {
  const [draws, setDraws] = useState<TeamDraw[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("team_draws")
      .select("*")
      .eq("published", true);

    const rows = (data ?? []).map((d) => ({
      ...(d as TeamDraw),
      score_a: (d as Partial<TeamDraw>).score_a ?? null,
      score_b: (d as Partial<TeamDraw>).score_b ?? null,
    }));
    rows.sort((a, b) => sortKey(b) - sortKey(a));
    setDraws(rows);
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    refresh().finally(() => {
      if (active) setLoading(false);
    });

    // Any publish, score entry, or retraction anywhere updates the history.
    const channel = supabase
      .channel("team-draws-history")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_draws" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { draws, loading, reload: refresh };
}

/** Milliseconds to sort a draw by — published time, else drawn time. */
function sortKey(draw: TeamDraw): number {
  const stamp = draw.published_at ?? draw.drawn_at;
  const ms = stamp ? Date.parse(stamp) : NaN;
  return Number.isNaN(ms) ? 0 : ms;
}
