"use client";

import { useEffect, useState } from "react";

/**
 * "Turn the lights on" — a playful toggle that kicks the Friday Night Lights
 * effect in.
 *
 * It only flips a single `lights-on` class on the <html> element; every visual
 * (a stadium floodlight wash, brighter neon rims, a one-shot flicker) lives in
 * globals.css. That keeps this component free of any per-frame work and adds no
 * second rAF loop, so it stays inside the background rendering budget the repo
 * cares about. The class is removed on unmount, so navigating away from the
 * home page turns the lights back off on its own.
 */
export function LightsToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("lights-on", on);
    return () => root.classList.remove("lights-on");
  }, [on]);

  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      className={`mt-1 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.62rem] font-black tracking-[0.24em] uppercase transition-all duration-300 sm:text-[0.68rem] ${
        on
          ? "border-neon-yellow/70 text-neon-yellow bg-neon-yellow/10 drop-shadow-[0_0_16px_rgba(240,255,0,0.55)]"
          : "border-neon-cyan/30 text-neon-cyan/85 hover:border-neon-cyan/60 hover:text-neon-cyan hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2.5 w-2.5 rounded-full transition-all duration-300 ${
          on
            ? "bg-neon-yellow shadow-[0_0_12px_3px_rgba(240,255,0,0.8)]"
            : "bg-starlight-faint/50"
        }`}
      />
      {on ? "Lights are on" : "Turn the lights on"}
    </button>
  );
}
