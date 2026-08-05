"use client";

/*
 * TEMPORARY FNL — Friday Night Lights toggle.
 *
 * A small, purely-decorative button that washes the page in stadium light. It
 * touches no data and no team logic. To revert after the Friday game: delete
 * this file, remove its <LightsToggle /> use in src/app/page.tsx, and delete
 * the ".fnl-*" block in globals.css.
 *
 * Design notes:
 *  - Zero layout shift: the button has a fixed min-width so its two labels
 *    ("Turn on the lights" / "Lights on") never resize it, and the light
 *    overlays are position:fixed + pointer-events:none, so they sit on top of
 *    the scene without disturbing flow or blocking taps.
 *  - Touch-first: full-height tap target, clear pressed/active states.
 *  - Reduced motion: the beams and flash are handled by CSS that collapses
 *    under prefers-reduced-motion, so the lights still turn on — just without
 *    the animation.
 */

import { useEffect, useRef, useState } from "react";

export function LightsToggle() {
  const [on, setOn] = useState(false);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  function toggle() {
    setOn((prev) => {
      const next = !prev;
      if (next) {
        // Re-trigger the one-shot pulse each time the lights come on.
        setFlash(false);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        window.requestAnimationFrame(() => setFlash(true));
        flashTimer.current = window.setTimeout(() => setFlash(false), 720);
      }
      return next;
    });
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={`fnl-lights-overlay${on ? " is-on" : ""}`}
      />
      {flash && <div aria-hidden="true" className="fnl-lights-flash" />}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={on}
          aria-label={on ? "Turn off the lights" : "Turn on the lights"}
          className={`inline-flex min-w-[15rem] items-center justify-center gap-2.5 rounded-full border-2 px-6 py-3.5 text-sm font-black tracking-[0.18em] uppercase transition-all duration-300 ease-out select-none active:scale-[0.97] ${
            on
              ? "border-neon-yellow text-neon-yellow bg-neon-yellow/10"
              : "text-starlight-dim hover:border-neon-yellow/50 hover:text-neon-yellow/90 border-white/12 bg-white/[0.03]"
          }`}
          style={
            on
              ? {
                  textShadow: "0 0 16px rgba(240,255,0,0.7)",
                  animation: "fnl-btn-pulse 2.4s ease-in-out infinite",
                }
              : undefined
          }
        >
          <span
            aria-hidden="true"
            className={`h-3 w-3 shrink-0 rounded-full transition-all duration-300 ${
              on ? "bg-neon-yellow" : "bg-white/25"
            }`}
            style={
              on
                ? {
                    boxShadow:
                      "0 0 10px 2px rgba(240,255,0,0.95), 0 0 22px 4px rgba(240,255,0,0.6)",
                  }
                : undefined
            }
          />
          {on ? "Lights on" : "Turn on the lights"}
        </button>
      </div>
    </>
  );
}
