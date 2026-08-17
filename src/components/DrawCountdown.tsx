"use client";

import { useEffect, useState } from "react";

import { minutesToCutoff } from "@/lib/cutoff";

/**
 * Public countdown to the weekly draw.
 *
 * Shown only while teams are unpublished — once the draw goes up, FinalDraw
 * takes over and this disappears. The cutoff is soft, so after it passes this
 * says the draw is imminent rather than claiming check-in is closed; stragglers
 * can still add their name.
 */
export function DrawCountdown({ checkedIn }: { checkedIn: number }) {
  const [minutes, setMinutes] = useState<number | null>(null);

  // Computed after mount so server and client can't disagree on the clock.
  useEffect(() => {
    const tick = () => setMinutes(minutesToCutoff());
    tick();
    const id = setInterval(tick, 30_000);

    // Phones throttle or suspend timers in a backgrounded tab, and iOS restores
    // pages from the bfcache without restarting them, so a countdown can be
    // frozen at whatever it read when the screen locked. Re-read the clock on
    // resume instead of waiting up to 30s for the next tick.
    const resync = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("pageshow", resync);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("pageshow", resync);
    };
  }, []);

  const days = minutes === null ? 0 : Math.floor(minutes / 1440);
  const hours = minutes === null ? 0 : Math.floor((minutes % 1440) / 60);
  const mins = minutes === null ? 0 : minutes % 60;
  const imminent = minutes !== null && minutes < 60;

  return (
    <section className="glass-panel rounded-blob px-5 py-5 text-center sm:px-7">
      <p className="text-neon-yellow text-[0.68rem] font-black tracking-[0.3em] uppercase drop-shadow-[0_0_12px_rgba(240,255,0,0.65)]">
        {imminent ? "Draw is imminent" : "Teams drop in"}
      </p>

      <div
        className="mt-3 flex items-end justify-center gap-3 sm:gap-5"
        aria-live="polite"
        aria-label={
          minutes === null
            ? "Loading countdown"
            : `Teams drawn in ${days} days ${hours} hours ${mins} minutes`
        }
      >
        {(
          [
            ["Days", days],
            ["Hrs", hours],
            ["Min", mins],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="min-w-[3.75rem]">
            <p
              className={`text-glow-title text-4xl font-black tabular-nums sm:text-5xl ${
                minutes === null ? "opacity-30" : ""
              }`}
            >
              {minutes === null ? "--" : String(value).padStart(2, "0")}
            </p>
            <p className="text-starlight-faint mt-0.5 text-[0.6rem] font-black tracking-[0.24em] uppercase">
              {label}
            </p>
          </div>
        ))}
      </div>

      <p className="text-starlight-dim mt-4 text-xs font-bold tracking-[0.14em] uppercase">
        {checkedIn === 0 ? (
          "Nobody checked in yet"
        ) : (
          <>
            <span className="text-neon-cyan">{checkedIn}</span> in the hat ·
            red rover draft{" "}
            <span className="whitespace-nowrap">Friday 7 PM</span>
          </>
        )}
      </p>
    </section>
  );
}
