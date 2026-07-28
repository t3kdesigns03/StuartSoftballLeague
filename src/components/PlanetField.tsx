"use client";

import { useEffect, useRef } from "react";

import {
  makePlanetSprite,
  makeSquirrelSprite,
  PLANET_KINDS,
  type PlanetKind,
} from "@/lib/planetSprites";

type Planet = {
  kind: PlanetKind;
  sprite: HTMLCanvasElement;
  /** Sprite canvas is padded for glow; this is the padded CSS size. */
  drawSize: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Baseline drift velocity the ball springs back to after being pushed. */
  bvx: number;
  bvy: number;
  angle: number;
  spin: number;
  /** 0.35 (far, small, slow) to 1 (near). Drives parallax and opacity. */
  depth: number;
};

type Spark = { x: number; y: number; vx: number; vy: number; life: number; r: number };

type Squirrel = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  baseY: number;
  t: number;
  size: number;
  angle: number;
  /** Extra spin added when poked, decays back to zero. */
  spinBoost: number;
  nextAt: number;
  reactedAt: number;
};

const REPEL_RADIUS = 190;
const REPEL_FORCE = 2600;

/**
 * Planet softballs drifting through the cosmos, plus a rare Sabertooth Squirrel.
 *
 * Performance notes — this runs behind every page, so it has to be cheap:
 *  - Every planet is rendered to an offscreen sprite once at mount. The frame
 *    loop only does `drawImage` with a rotation transform, so per-frame cost is
 *    a handful of blits rather than hundreds of path operations.
 *  - One canvas, one rAF loop. DOM elements can't rotate-and-collide cheaply.
 *  - Backing store is capped at 1.5x DPR; on a 400x800 phone that is ~7 MB.
 *  - The loop stops entirely when the tab is hidden and never starts under
 *    prefers-reduced-motion.
 *  - Ball count and size scale down on small screens.
 */
export function PlanetField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = 0;
    let height = 0;
    let planets: Planet[] = [];
    let sparks: Spark[] = [];
    let frame = 0;
    let last = 0;
    let running = true;

    const pointer = { x: -9999, y: -9999, active: false };

    // ---------------------------------------------------------------- setup --
    const spriteCache = new Map<string, HTMLCanvasElement>();
    const spriteFor = (kind: PlanetKind, size: number) => {
      // Quantise size so we cache a handful of sprites, not one per ball.
      const bucket = Math.round(size / 8) * 8;
      const key = `${kind}:${bucket}`;
      let sprite = spriteCache.get(key);
      if (!sprite) {
        sprite = makePlanetSprite(kind, bucket, dpr);
        spriteCache.set(key, sprite);
      }
      return { sprite, bucket };
    };

    const squirrelSize = 74;
    const squirrelSprite = makeSquirrelSprite(squirrelSize, dpr);
    const squirrel: Squirrel = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      baseY: 0,
      t: 0,
      size: squirrelSize,
      angle: 0,
      spinBoost: 0,
      nextAt: performance.now() + 12_000 + Math.random() * 20_000,
      reactedAt: -9999,
    };

    function build() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const narrow = width < 640;
      // Fewer, slightly smaller balls on a phone — the magic survives, the
      // fill-rate cost does not.
      const count = narrow ? 6 : 9;
      const scale = narrow ? 0.72 : 1;

      planets = Array.from({ length: count }, (_, i) => {
        const kind = PLANET_KINDS[i % PLANET_KINDS.length];
        const depth = 0.38 + Math.random() * 0.62;
        const size = (58 + depth * 92) * scale;
        const { sprite, bucket } = spriteFor(kind, size);
        const drawSize = bucket * 1.84; // sprite includes 42% padding each side
        const speed = (7 + depth * 16) / 60;
        const dir = Math.random() * Math.PI * 2;
        return {
          kind,
          sprite,
          drawSize,
          radius: bucket / 2,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(dir) * speed,
          vy: Math.sin(dir) * speed,
          bvx: Math.cos(dir) * speed,
          bvy: Math.sin(dir) * speed,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.0055 * (0.4 + depth),
          depth,
        };
      });
    }

    // -------------------------------------------------------------- drawing --
    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of planets) {
        ctx!.save();
        ctx!.globalAlpha = 0.28 + p.depth * 0.42;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.angle);
        ctx!.drawImage(p.sprite, -p.drawSize / 2, -p.drawSize / 2, p.drawSize, p.drawSize);
        ctx!.restore();
      }
    }

    function step(now: number) {
      if (!running) return;
      const dt = Math.min(48, now - last || 16);
      last = now;

      ctx!.clearRect(0, 0, width, height);

      // ---- planets --------------------------------------------------------
      for (const p of planets) {
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL_RADIUS * REPEL_RADIUS) {
            const d = Math.sqrt(d2) || 1;
            // Bigger, nearer balls shove less — they read as heavier.
            const mass = 0.5 + p.depth;
            const f = ((1 - d / REPEL_RADIUS) * REPEL_FORCE) / (d * mass * 1000);
            p.vx += dx * f;
            p.vy += dy * f;
            p.spin += (dx > 0 ? 1 : -1) * 0.00004 * (1 - d / REPEL_RADIUS);
          }
        }

        // Spring back toward the baseline drift so pushes decay rather than
        // accumulating into pinball.
        p.vx += (p.bvx - p.vx) * 0.022;
        p.vy += (p.bvy - p.vy) * 0.022;

        p.x += p.vx * dt * 0.06;
        p.y += p.vy * dt * 0.06;
        p.angle += p.spin * dt;
        p.spin += (0 - p.spin) * 0.0006 * dt;

        // Wrap with a margin so they slide off rather than pop.
        const m = p.drawSize * 0.6;
        if (p.x < -m) p.x = width + m;
        if (p.x > width + m) p.x = -m;
        if (p.y < -m) p.y = height + m;
        if (p.y > height + m) p.y = -m;

        ctx!.save();
        ctx!.globalAlpha = 0.28 + p.depth * 0.42;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.angle);
        ctx!.drawImage(p.sprite, -p.drawSize / 2, -p.drawSize / 2, p.drawSize, p.drawSize);
        ctx!.restore();
      }

      // ---- squirrel -------------------------------------------------------
      if (!squirrel.active && now >= squirrel.nextAt) {
        const fromLeft = Math.random() < 0.5;
        squirrel.active = true;
        squirrel.baseY = height * (0.15 + Math.random() * 0.6);
        squirrel.y = squirrel.baseY;
        squirrel.x = fromLeft ? -80 : width + 80;
        squirrel.vx = (fromLeft ? 1 : -1) * (0.13 + Math.random() * 0.08);
        squirrel.t = 0;
        squirrel.angle = 0;
        squirrel.spinBoost = 0;
      }

      if (squirrel.active) {
        squirrel.t += dt;
        squirrel.x += squirrel.vx * dt;
        // Bounding scamper — a sine bob with a little gallop on top.
        squirrel.y =
          squirrel.baseY +
          Math.sin(squirrel.t * 0.004) * 42 +
          Math.sin(squirrel.t * 0.014) * 9;
        squirrel.angle += squirrel.spinBoost * dt;
        squirrel.spinBoost += (0 - squirrel.spinBoost) * 0.004 * dt;

        // Poke reaction: cursor or tap within range.
        if (pointer.active && now - squirrel.reactedAt > 700) {
          const dx = squirrel.x - pointer.x;
          const dy = squirrel.y - pointer.y;
          if (dx * dx + dy * dy < 70 * 70) {
            squirrel.reactedAt = now;
            squirrel.spinBoost = (Math.random() < 0.5 ? -1 : 1) * 0.028;
            squirrel.vx *= 1.5;
            // Leave a trail of tiny softballs.
            for (let i = 0; i < 10; i++) {
              const a = Math.random() * Math.PI * 2;
              const sp = 0.08 + Math.random() * 0.22;
              sparks.push({
                x: squirrel.x,
                y: squirrel.y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 0.05,
                life: 1,
                r: 3 + Math.random() * 4,
              });
            }
          }
        }

        const off = squirrel.x < -140 || squirrel.x > width + 140;
        if (off) {
          squirrel.active = false;
          squirrel.nextAt = now + 45_000 + Math.random() * 75_000;
        } else {
          ctx!.save();
          ctx!.globalAlpha = 0.9;
          ctx!.translate(squirrel.x, squirrel.y);
          ctx!.rotate(squirrel.angle + Math.sin(squirrel.t * 0.004) * 0.12);
          if (squirrel.vx < 0) ctx!.scale(-1, 1);
          const s = squirrel.size * 1.6;
          ctx!.drawImage(squirrelSprite, -s / 2, -s / 2, s, s);
          ctx!.restore();
        }
      }

      // ---- sparks (tiny softballs) ---------------------------------------
      if (sparks.length) {
        for (const sp of sparks) {
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 0.0004 * dt; // gentle gravity
          sp.life -= dt / 1100;
        }
        sparks = sparks.filter((s) => s.life > 0);
        for (const sp of sparks) {
          ctx!.save();
          ctx!.globalAlpha = Math.max(0, sp.life) * 0.9;
          ctx!.fillStyle = "#eaff00";
          ctx!.beginPath();
          ctx!.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.strokeStyle = "#ff2d55";
          ctx!.lineWidth = 1.1;
          ctx!.beginPath();
          ctx!.arc(sp.x, sp.y, sp.r * 0.62, -0.9, 0.9);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.arc(sp.x, sp.y, sp.r * 0.62, Math.PI - 0.9, Math.PI + 0.9);
          ctx!.stroke();
          ctx!.restore();
        }
      }

      frame = requestAnimationFrame(step);
    }

    // -------------------------------------------------------------- events --
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        if (reduced.matches) drawStatic();
      }, 180);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else if (!reduced.matches && !frame) {
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(step);
      }
    };

    build();

    if (reduced.matches) {
      drawStatic();
    } else {
      last = performance.now();
      frame = requestAnimationFrame(step);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerLeave, { passive: true });
      window.addEventListener("pointercancel", onPointerLeave, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
    }
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerup", onPointerLeave);
      window.removeEventListener("pointercancel", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
