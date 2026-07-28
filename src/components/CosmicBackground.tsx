"use client";

import { useEffect, useState } from "react";

import { PlanetField } from "@/components/PlanetField";

/**
 * Star tile size in CSS pixels. The tile is repeated by CSS on *both* axes, so
 * this does not need to cover the viewport — it only controls how often the
 * pattern repeats. The drift animation moves by exactly this distance, which is
 * what makes the loop seamless.
 */
const STAR_TILE = 1000;

/** Backing-store multiplier. Stars are soft glows, so 1.5x is plenty. */
const STAR_DPR = 1.5;

/**
 * Fixed, non-interactive atmosphere layer: nebula glows and a drifting
 * starfield. Planet softballs and the squirrel are drawn on top by PlanetField.
 *
 * Memory: the starfield is painted once into a single offscreen canvas, handed
 * to the compositor as one repeating background image, and the canvas is thrown
 * away. That is ~9 MB of bitmap. An earlier version stacked three full-width
 * canvases in the DOM and cost ~92 MB, which is enough to get a tab evicted on
 * a mid-range phone.
 *
 * Motion: the starfield drift is a pure CSS transform (compositor-only, no
 * per-frame JS). The planet softballs and the squirrel live on their own canvas
 * in PlanetField, which owns the only rAF loop on the page.
 */
export function CosmicBackground() {
  const [starsUrl, setStarsUrl] = useState<string | null>(null);

  // Paint the star tile once, hand it over as an object URL, drop the canvas.
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = STAR_TILE * STAR_DPR;
    canvas.height = STAR_TILE * STAR_DPR;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(STAR_DPR, STAR_DPR);

    const TINTS = [
      "255,255,255",
      "255,255,255",
      "200,240,255",
      "0,240,255",
      "255,0,170",
      "176,0,255",
      "240,255,0",
    ];

    // Deterministic PRNG so the sky is identical between server and client
    // renders and between reloads.
    let s = 20260721;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    for (let i = 0; i < 230; i++) {
      const x = rand() * STAR_TILE;
      const y = rand() * STAR_TILE;
      const r = rand() * 1.5 + 0.35;
      const tint = TINTS[Math.floor(rand() * TINTS.length)];
      const alpha = rand() * 0.7 + 0.25;

      if (r > 1.15) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
        glow.addColorStop(0, `rgba(${tint},${alpha * 0.5})`);
        glow.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(${tint},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    let url: string | null = null;
    let cancelled = false;

    // toBlob encodes off the main thread in most browsers, unlike toDataURL.
    canvas.toBlob((blob) => {
      if (!blob || cancelled) return;
      url = URL.createObjectURL(blob);
      setStarsUrl(url);
    }, "image/png");

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ ["--star-tile" as string]: `${STAR_TILE}px` }}
    >
      {/* Base wash: near-black into deep indigo */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#05050f_0%,#0a0a1a_36%,#130b2c_70%,#05050f_100%)]" />

      {/* Nebula corner glows */}
      <div
        className="absolute -top-[22%] -left-[18%] h-[70vmax] w-[70vmax] rounded-full blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(176,0,255,0.36) 0%, rgba(255,0,170,0.17) 42%, transparent 68%)",
          animation: "nebula-breathe 16s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -top-[14%] -right-[20%] h-[62vmax] w-[62vmax] rounded-full blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(0,240,255,0.32) 0%, rgba(0,120,255,0.15) 45%, transparent 70%)",
          animation: "nebula-breathe 21s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute -bottom-[30%] left-[10%] h-[66vmax] w-[66vmax] rounded-full blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,0,170,0.26) 0%, rgba(176,0,255,0.13) 48%, transparent 72%)",
          animation: "nebula-breathe 26s ease-in-out infinite",
        }}
      />

      {/*
        Drifting starfield. One repeating background image on one element that
        overhangs the viewport by exactly one tile, so translating up by one
        tile always leaves the screen covered and lands the pattern back on
        itself.
      */}
      {starsUrl && (
        <div
          className="absolute inset-x-0 top-0 h-[calc(100%+var(--star-tile))]"
          style={{
            backgroundImage: `url(${starsUrl})`,
            backgroundRepeat: "repeat",
            backgroundSize: `${STAR_TILE}px ${STAR_TILE}px`,
            animation: "drift 110s linear infinite",
            willChange: "transform",
          }}
        />
      )}

      {/*
        Planet softballs + the Sabertooth Squirrel. Sits above the starfield and
        below the vignette, so the vignette still dims the edges and keeps the
        centre of the page readable.
      */}
      <PlanetField />

      {/* Vignette keeps the centre readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(5,5,15,0.5)_76%,rgba(5,5,15,0.88)_100%)]" />
    </div>
  );
}
