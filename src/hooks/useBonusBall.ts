"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { BonusPool, Gender } from "@/lib/types";

const IDENTITY_KEY = "ssl26_bonus_name";
const POLL_MS = 12_000;

/**
 * Client state for the voluntary Bonus Ball pool.
 *
 * Two facts drive the UI:
 *   - `enabled`: the league_state flag, read live so flipping it on the admin
 *     page reveals the teaser everywhere without a refresh. Defaults to `false`
 *     and stays false if the column is missing, so a deploy that lands before
 *     its migration simply shows the feature off rather than erroring.
 *   - `pool`: the current week's total + names. These are public now, so the
 *     pool is fetched for everyone whenever the feature is on — no identity
 *     required. `member` in the payload only says whether the name we send
 *     matches an entrant, which drives the "you're in" badge.
 *
 * Identity with no accounts: we remember the name someone entered under in
 * localStorage and send it so the server can flag `member`. If the week has
 * rolled, `member` comes back false and the badge clears on its own.
 *
 * "Live" without a realtime leak: bonus_entries is not anon-readable, so we
 * can't subscribe to it from the browser. Instead the pool polls on an interval
 * and refetches when the tab regains focus — plenty for a $5 pool and
 * consistent with the app's "simple and reliable" bias.
 */
export function useBonusBall() {
  const [enabled, setEnabled] = useState(false);
  const [entrantName, setEntrantName] = useState<string | null>(null);
  const [pool, setPool] = useState<BonusPool | null>(null);
  const [loading, setLoading] = useState(true);
  const nameRef = useRef<string | null>(null);

  // Whether the *server* currently counts this visitor as an entrant.
  const entered = pool?.enabled === true && pool.member === true;

  // Read (and keep) the name we last entered under.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(IDENTITY_KEY);
      if (saved) {
        nameRef.current = saved;
        setEntrantName(saved);
      }
    } catch {
      // Private mode / storage disabled — the feature still works this session.
    }
  }, []);

  const fetchPool = useCallback(async () => {
    // The pool is public, so we always fetch. The name (if we have one) is sent
    // only so the server can flag `member` for the "you're in" badge; an empty
    // string just yields member: false with the same public total + names.
    const { data, error } = await supabase.rpc("bonus_pool", {
      p_name: nameRef.current ?? "",
    });
    if (!error && data) setPool(data as BonusPool);
  }, []);

  // Live feature flag: read once, then follow league_state UPDATEs.
  useEffect(() => {
    let active = true;

    const readFlag = async () => {
      // select("*") so a missing column can't 400 the whole request; default to
      // off when the flag isn't present yet.
      const { data } = await supabase
        .from("league_state")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (!active) return;
      const flag = Boolean(
        (data as { bonus_ball_enabled?: boolean } | null)?.bonus_ball_enabled,
      );
      setEnabled(flag);
      setLoading(false);
      // Fetching is driven reactively by the effect below (fires the moment the
      // flag and an identity are both known), so we only need to clear a stale
      // pool if the feature is off.
      if (!flag) setPool(null);
    };

    void readFlag();

    const channel = supabase
      .channel("bonus-flag")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "league_state" },
        (payload) => {
          const next = payload.new as {
            bonus_ball_enabled?: boolean;
            current_week_id?: string;
          };
          setEnabled(Boolean(next.bonus_ball_enabled));
          // A flag flip or a week roll both change what the pool should show.
          if (next.bonus_ball_enabled) void fetchPool();
          else setPool(null);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [fetchPool]);

  // As soon as the feature is on, fetch the pool for everyone — then keep it
  // fresh with a poll and on tab focus. Re-runs when the identity changes so the
  // "you're in" badge updates right after someone joins.
  useEffect(() => {
    if (!enabled) return;

    void fetchPool();
    const id = window.setInterval(() => void fetchPool(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchPool();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [enabled, entrantName, fetchPool]);

  /**
   * Opt into the pool. Records the entry server-side (idempotent), remembers the
   * name for this browser, and reveals the pool. Returns true on success.
   */
  const enter = useCallback(
    async (name: string, gender: Gender): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const { error } = await supabase.rpc("enter_bonus_ball", {
        p_name: trimmed,
        p_gender: gender,
      });
      if (error) return false;

      nameRef.current = trimmed;
      setEntrantName(trimmed);
      try {
        window.localStorage.setItem(IDENTITY_KEY, trimmed);
      } catch {
        // Non-fatal: they stay revealed this session even without storage.
      }
      await fetchPool();
      return true;
    },
    [fetchPool],
  );

  /**
   * Reveal the pool for someone who is *already* in it, without entering again.
   *
   * Asks the server (the same membership-gated RPC), and only if it confirms
   * membership do we adopt that name as this browser's identity — so a member
   * arriving on a new device or after clearing storage can surface the live
   * "who's in" view by typing their name, and it sticks for next time. A
   * non-member learns nothing (the gate returns `member: false`) and no identity
   * is stored. This is a read only; it never records an entry.
   */
  const reveal = useCallback(
    async (name: string): Promise<"member" | "not-member" | "error"> => {
      const trimmed = name.trim();
      if (!trimmed) return "error";

      const { data, error } = await supabase.rpc("bonus_pool", {
        p_name: trimmed,
      });
      if (error || !data) return "error";

      const result = data as BonusPool;
      if (result.enabled && result.member) {
        nameRef.current = trimmed;
        setEntrantName(trimmed);
        try {
          window.localStorage.setItem(IDENTITY_KEY, trimmed);
        } catch {
          // Non-fatal — revealed this session even without storage.
        }
        setPool(result);
        return "member";
      }
      return "not-member";
    },
    [],
  );

  return {
    enabled,
    entered,
    entrantName,
    pool,
    loading,
    enter,
    reveal,
    refresh: fetchPool,
  };
}

export type UseBonusBall = ReturnType<typeof useBonusBall>;
