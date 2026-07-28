/**
 * Planet-softball sprite factory.
 *
 * Each planet is drawn **once** into an offscreen canvas at mount and then
 * blitted every frame with a rotation transform. Redrawing the stitches, the
 * surface detail and the shading 60 times a second for 8 balls would be
 * hundreds of path operations per frame; caching turns that into 8 drawImage
 * calls, which is what makes this viable on a mid-range phone.
 */

export type PlanetKind =
  | "classic"
  | "mars"
  | "ice"
  | "gasGiant"
  | "swamp"
  | "moon"
  | "sun"
  | "neon";

type Palette = {
  /** Base sphere gradient, light side to dark side. */
  light: string;
  mid: string;
  dark: string;
  /** Surface markings. */
  detail: string;
  /** Stitch colour — kept high-contrast so it always reads as a softball. */
  stitch: string;
  /** Outer glow. */
  glow: string;
  rings?: string;
};

export const PLANETS: Record<PlanetKind, Palette> = {
  classic: {
    light: "#fbffc9",
    mid: "#e8ff3a",
    dark: "#6b7a00",
    detail: "#c8dd00",
    stitch: "#ff2d55",
    glow: "rgba(232,255,58,0.55)",
  },
  mars: {
    light: "#ffb98a",
    mid: "#d24a1e",
    dark: "#4a1206",
    detail: "#8f2c10",
    stitch: "#ffd6df",
    glow: "rgba(255,90,40,0.5)",
  },
  ice: {
    light: "#ffffff",
    mid: "#8fd8ff",
    dark: "#0e3a63",
    detail: "#d7f1ff",
    stitch: "#ff3b6b",
    glow: "rgba(120,215,255,0.55)",
  },
  gasGiant: {
    light: "#e3b6ff",
    mid: "#a13cff",
    dark: "#2a0350",
    detail: "#c77bff",
    stitch: "#ffe14d",
    glow: "rgba(176,0,255,0.55)",
    rings: "rgba(226,178,255,0.75)",
  },
  swamp: {
    light: "#c6ff9e",
    mid: "#3fa22c",
    dark: "#0c2b08",
    detail: "#7fd45a",
    stitch: "#ff4d4d",
    glow: "rgba(80,220,60,0.5)",
  },
  moon: {
    light: "#e8eef7",
    mid: "#8b93a6",
    dark: "#1d2230",
    detail: "#6a7284",
    stitch: "#ff4f7a",
    glow: "rgba(190,205,230,0.4)",
  },
  sun: {
    light: "#fff6c2",
    mid: "#ffb020",
    dark: "#7a3b00",
    detail: "#ff8a00",
    stitch: "#ff2d55",
    glow: "rgba(255,175,30,0.65)",
  },
  neon: {
    light: "#c9fff4",
    mid: "#00f0ff",
    dark: "#00323f",
    detail: "#7bffe9",
    stitch: "#ff00aa",
    glow: "rgba(0,240,255,0.6)",
  },
};

export const PLANET_KINDS = Object.keys(PLANETS) as PlanetKind[];

/** Deterministic PRNG so a given planet looks the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Draw the two classic softball seams plus their cross-stitches.
 * Kept deliberately bold — this is what stops the planets reading as marbles.
 */
function drawStitches(
  ctx: CanvasRenderingContext2D,
  r: number,
  colour: string,
) {
  const seam = (dir: 1 | -1) => {
    ctx.beginPath();
    ctx.moveTo(dir * r * 0.62, -r * 0.78);
    ctx.bezierCurveTo(
      dir * r * 0.16,
      -r * 0.34,
      dir * r * 0.16,
      r * 0.34,
      dir * r * 0.62,
      r * 0.78,
    );
    ctx.stroke();
  };

  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineCap = "round";

  // Seam lines
  ctx.lineWidth = Math.max(2, r * 0.055);
  ctx.globalAlpha = 0.95;
  seam(1);
  seam(-1);

  // Cross-stitches along each seam
  ctx.lineWidth = Math.max(1.5, r * 0.042);
  for (const dir of [1, -1] as const) {
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7;
      // Point on the bezier, approximated with the same control points.
      const mt = 1 - t;
      const x =
        mt * mt * mt * (dir * r * 0.62) +
        3 * mt * mt * t * (dir * r * 0.16) +
        3 * mt * t * t * (dir * r * 0.16) +
        t * t * t * (dir * r * 0.62);
      const y =
        mt * mt * mt * -r * 0.78 +
        3 * mt * mt * t * -r * 0.34 +
        3 * mt * t * t * r * 0.34 +
        t * t * t * r * 0.78;
      const len = r * 0.15;
      ctx.beginPath();
      ctx.moveTo(x - dir * len, y - len * 0.32);
      ctx.lineTo(x + dir * len * 0.35, y + len * 0.32);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Per-planet surface markings, clipped to the sphere. */
function drawSurface(
  ctx: CanvasRenderingContext2D,
  kind: PlanetKind,
  r: number,
  p: Palette,
) {
  const rand = rng(kind.length * 9973 + r);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  if (kind === "gasGiant" || kind === "sun") {
    // Horizontal bands
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = p.detail;
    for (let i = -4; i <= 4; i++) {
      const y = (i / 5) * r;
      const h = r * (0.06 + rand() * 0.09);
      ctx.beginPath();
      ctx.ellipse(0, y, r * 1.05, h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "moon" || kind === "mars") {
    // Craters
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r * 0.86;
      const cr = r * (0.05 + rand() * 0.13);
      const cx = Math.cos(a) * d;
      const cy = Math.sin(a) * d;
      ctx.fillStyle = p.dark;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.detail;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(cx - cr * 0.18, cy - cr * 0.18, cr * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4;
    }
  } else if (kind === "swamp" || kind === "classic" || kind === "neon") {
    // Continents / blotches
    ctx.globalAlpha = kind === "classic" ? 0.22 : 0.38;
    ctx.fillStyle = p.detail;
    for (let i = 0; i < 7; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * r * 0.7;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * d,
        Math.sin(a) * d,
        r * (0.14 + rand() * 0.22),
        r * (0.09 + rand() * 0.16),
        rand() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  } else if (kind === "ice") {
    // Polar caps and cracks
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = p.detail;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.82, r * 0.62, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, r * 0.82, r * 0.55, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = Math.max(1, r * 0.02);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-r, (rand() - 0.5) * r * 1.4);
      ctx.lineTo(r, (rand() - 0.5) * r * 1.4);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Render one planet softball to its own canvas.
 * `size` is the sprite's CSS diameter; `dpr` its backing-store multiplier.
 */
export function makePlanetSprite(
  kind: PlanetKind,
  size: number,
  dpr: number,
): HTMLCanvasElement {
  const p = PLANETS[kind];
  // Padding leaves room for the glow and any rings without clipping.
  const pad = size * 0.42;
  const full = size + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(full * dpr);
  canvas.height = Math.ceil(full * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.translate(full / 2, full / 2);
  const r = size / 2;

  // --- outer glow ----------------------------------------------------------
  const glow = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, r * 1.75);
  glow.addColorStop(0, p.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.75, 0, Math.PI * 2);
  ctx.fill();

  // --- rings: back half, drawn before the sphere so it occludes them -------
  const RING_TILT = -0.38;
  const drawRing = (from: number, to: number, alpha: number) => {
    if (!p.rings) return;
    ctx.save();
    ctx.rotate(RING_TILT);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = p.rings;
    ctx.lineCap = "butt";
    for (const [rx, ry, w] of [
      [1.5, 0.42, 0.075],
      [1.3, 0.36, 0.05],
    ] as const) {
      ctx.lineWidth = r * w;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * rx, r * ry, 0, from, to);
      ctx.stroke();
    }
    ctx.restore();
  };
  drawRing(Math.PI, Math.PI * 2, 0.55);

  // --- sphere body ---------------------------------------------------------
  const body = ctx.createRadialGradient(
    -r * 0.32,
    -r * 0.36,
    r * 0.08,
    0,
    0,
    r,
  );
  body.addColorStop(0, p.light);
  body.addColorStop(0.55, p.mid);
  body.addColorStop(1, p.dark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  drawSurface(ctx, kind, r, p);

  // --- leather grain -------------------------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  const grain = rng(1234 + kind.length);
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000";
  for (let i = 0; i < 90; i++) {
    const a = grain() * Math.PI * 2;
    const d = Math.sqrt(grain()) * r;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.03 * grain(), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- stitches ------------------------------------------------------------
  drawStitches(ctx, r, p.stitch);

  // --- terminator (dark limb) + rim light ---------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  const shade = ctx.createRadialGradient(
    -r * 0.3,
    -r * 0.34,
    r * 0.2,
    0,
    0,
    r * 1.08,
  );
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(0.62, "rgba(0,0,0,0.05)");
  shade.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = shade;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth / 2, Math.PI * 1.05, Math.PI * 1.85);
  ctx.stroke();

  // Specular highlight
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-r * 0.34, -r * 0.38, r * 0.19, r * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Front half of the rings, over the sphere — this is what sells the tilt.
  drawRing(0, Math.PI, 0.8);

  return canvas;
}

/**
 * The Sabertooth Squirrel: chaotic little league mascot, drawn bold and simple
 * so it reads at 40px. Faces right; the loop mirrors it when travelling left.
 */
export function makeSquirrelSprite(size: number, dpr: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const pad = size * 0.3;
  const full = size + pad * 2;
  canvas.width = Math.ceil(full * dpr);
  canvas.height = Math.ceil(full * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.translate(full / 2, full / 2);
  const s = size / 100; // draw in a 100-unit space, then scale

  const FUR = "#8b5cf6";
  const FUR_DARK = "#5b21b6";
  const BELLY = "#c4b5fd";

  // Glow so it pops against the nebula
  const glow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 0.75);
  glow.addColorStop(0, "rgba(176,0,255,0.5)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(s, s);

  // --- big bushy tail, curling up and over --------------------------------
  ctx.fillStyle = FUR_DARK;
  ctx.beginPath();
  ctx.moveTo(-14, 18);
  // outer edge sweeps left, up and over the back
  ctx.bezierCurveTo(-54, 20, -62, -30, -30, -46);
  ctx.bezierCurveTo(-8, -56, 6, -40, -2, -30);
  // inner edge returns
  ctx.bezierCurveTo(-6, -38, -20, -40, -32, -30);
  ctx.bezierCurveTo(-46, -16, -38, 6, -10, 6);
  ctx.closePath();
  ctx.fill();
  // lighter fur streak so it reads as bushy rather than flat
  ctx.fillStyle = FUR;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-18, 12);
  ctx.bezierCurveTo(-46, 12, -50, -26, -26, -38);
  ctx.bezierCurveTo(-38, -22, -34, -2, -14, 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // --- body ----------------------------------------------------------------
  ctx.fillStyle = FUR;
  ctx.beginPath();
  ctx.ellipse(-4, 8, 22, 18, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BELLY;
  ctx.beginPath();
  ctx.ellipse(0, 13, 13, 11, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // --- head ----------------------------------------------------------------
  ctx.fillStyle = FUR;
  ctx.beginPath();
  ctx.arc(16, -10, 17, 0, Math.PI * 2);
  ctx.fill();

  // ears
  ctx.beginPath();
  ctx.moveTo(6, -24);
  ctx.lineTo(2, -40);
  ctx.lineTo(16, -28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(24, -25);
  ctx.lineTo(30, -40);
  ctx.lineTo(32, -22);
  ctx.closePath();
  ctx.fill();

  // muzzle
  ctx.fillStyle = BELLY;
  ctx.beginPath();
  ctx.ellipse(25, -5, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- eyes (big, slightly unhinged) --------------------------------------
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(14, -14, 6.5, 0, Math.PI * 2);
  ctx.arc(27, -15, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a1a";
  ctx.beginPath();
  ctx.arc(16, -14, 3.2, 0, Math.PI * 2);
  ctx.arc(28.5, -15, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // nose
  ctx.fillStyle = "#ff2d55";
  ctx.beginPath();
  ctx.arc(33, -5, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // --- SABERTOOTH FANGS ----------------------------------------------------
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.8;
  for (const [fx, fl] of [
    [22, 20],
    [30, 16],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(fx - 3, 0);
    ctx.lineTo(fx + 3, 0);
    ctx.lineTo(fx + 0.5, fl);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // --- tiny bat, held out ahead and low so it never crosses the fangs ------
  ctx.save();
  ctx.translate(20, 26);
  ctx.rotate(0.7);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#c98b3a"; // handle
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-4, 14);
  ctx.lineTo(6, -8);
  ctx.stroke();
  ctx.strokeStyle = "#f0ff00"; // barrel
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(6, -8);
  ctx.lineTo(14, -26);
  ctx.stroke();
  ctx.restore();

  // --- feet ----------------------------------------------------------------
  ctx.fillStyle = FUR_DARK;
  ctx.beginPath();
  ctx.ellipse(-8, 25, 7, 4, 0.2, 0, Math.PI * 2);
  ctx.ellipse(6, 26, 7, 4, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas;
}
