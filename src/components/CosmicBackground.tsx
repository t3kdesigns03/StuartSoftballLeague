"use client";

import { useEffect, useRef } from "react";

const STAR_TILE_W = 1600;
const STAR_TILE_H = 1200;

/**
 * Three *identical* tiles stacked vertically, scrolled by exactly one tile
 * height. Identical tiles are what makes the loop seamless — when the animation
 * resets, tile 2 sits precisely where tile 1 was. Three of them (rather than
 * two) means the viewport stays covered on screens up to 2400px tall.
 */
const STAR_TILES = [0, 1, 2];

/**
 * Fixed, non-interactive atmosphere layer: nebula glows, a drifting starfield,
 * and distant orbs that parallax gently with the pointer.
 *
 * Performance notes:
 *  - The starfield is painted once into two stacked canvases at mount, then
 *    animated with a CSS transform only (compositor work, no per-frame JS).
 *  - Parallax writes two CSS custom properties inside a single rAF, and is
 *    skipped entirely on touch devices and under prefers-reduced-motion.
 *  - Parallax and float live on separate elements so their transforms compose
 *    instead of overwriting each other.
 */
export function CosmicBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Paint the starfield once into every tile.
  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const paint = (canvas: HTMLCanvasElement | null, seed: number) => {
      if (!canvas) return;
      canvas.width = STAR_TILE_W * dpr;
      canvas.height = STAR_TILE_H * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const TINTS = [
        "255,255,255",
        "255,255,255",
        "200,240,255",
        "0,240,255",
        "255,0,170",
        "176,0,255",
        "240,255,0",
      ];

      // Deterministic per-tile PRNG so the two tiles differ but stay stable.
      let s = seed;
      const rand = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };

      for (let i = 0; i < 340; i++) {
        const x = rand() * STAR_TILE_W;
        const y = rand() * STAR_TILE_H;
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
    };

    // Same seed for every tile — identical tiles are what makes the loop seamless.
    canvasRefs.current.forEach((canvas) => paint(canvas, 20260721));
  }, []);

  // Pointer parallax.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    let frame = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (event: PointerEvent) => {
      tx = (event.clientX / window.innerWidth - 0.5) * 2;
      ty = (event.clientY / window.innerHeight - 0.5) * 2;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty("--px", tx.toFixed(3));
        root.style.setProperty("--py", ty.toFixed(3));
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden [--px:0] [--py:0]"
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

      {/* Drifting starfield: identical stacked tiles scrolling as one seamless loop */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{ animation: "drift 110s linear infinite" }}
        >
          {STAR_TILES.map((tile) => (
            <canvas
              key={tile}
              ref={(node) => {
                canvasRefs.current[tile] = node;
              }}
              className="block h-[1200px] w-[1600px] max-w-none"
            />
          ))}
        </div>
      </div>

      {/* Distant planets / floating softballs */}
      <Orb
        className="top-[13%] left-[6%] h-24 w-24 sm:h-32 sm:w-32"
        depth={26}
        delay="0s"
        duration="11s"
        background="radial-gradient(circle at 32% 28%, #ff6ad5 0%, #b000ff 45%, #3a006b 100%)"
        glow="rgba(255,0,170,0.5)"
      />
      <Orb
        className="top-[60%] right-[7%] h-32 w-32 sm:h-44 sm:w-44"
        depth={18}
        delay="1.4s"
        duration="14s"
        background="radial-gradient(circle at 35% 30%, #7ef9ff 0%, #00a2ff 48%, #001a4d 100%)"
        glow="rgba(0,240,255,0.45)"
      />
      <Orb
        className="top-[30%] right-[24%] h-14 w-14 sm:h-20 sm:w-20"
        depth={38}
        delay="0.7s"
        duration="9s"
        background="radial-gradient(circle at 34% 30%, #f5ff8a 0%, #d4e800 52%, #4a5200 100%)"
        glow="rgba(240,255,0,0.35)"
      />
      <Orb
        className="bottom-[12%] left-[20%] h-16 w-16 sm:h-24 sm:w-24"
        depth={32}
        delay="2.1s"
        duration="12s"
        background="radial-gradient(circle at 32% 30%, #b6ff9e 0%, #39ff14 50%, #073b00 100%)"
        glow="rgba(57,255,20,0.32)"
      />

      {/* Vignette keeps the centre readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(5,5,15,0.5)_76%,rgba(5,5,15,0.88)_100%)]" />
    </div>
  );
}

function Orb({
  className,
  depth,
  delay,
  duration,
  background,
  glow,
}: {
  className: string;
  depth: number;
  delay: string;
  duration: string;
  background: string;
  glow: string;
}) {
  return (
    // Outer element owns the parallax transform...
    <div
      className={`absolute ${className}`}
      style={{
        transform: `translate3d(calc(var(--px) * ${depth}px), calc(var(--py) * ${depth}px), 0)`,
        transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* ...inner element owns the float animation, so they compose. */}
      <div
        className="h-full w-full rounded-full"
        style={{
          background,
          opacity: 0.34,
          boxShadow: `0 0 70px ${glow}, inset -8px -10px 26px rgba(0,0,0,0.55)`,
          animation: `float-slow ${duration} ease-in-out ${delay} infinite`,
        }}
      />
    </div>
  );
}
