import type { BugBody, BugMotionConfig, BugSizeId, BugSizeSpec } from "./types";

export type { BugBody } from "./types";

const SIZE_ORDER: readonly BugSizeId[] = ["small", "medium", "large"];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scaleOf(motion: BugMotionConfig, reduced: boolean): number {
  if (!reduced) return 1;
  const scale = motion.reduced_motion_scale;
  if (!Number.isFinite(scale) || scale <= 0) return 0.45;
  return Math.min(1, scale);
}

function specFor(motion: BugMotionConfig, size: BugSizeId): BugSizeSpec {
  return motion.sizes[size];
}

export function bugHitPx(motion: BugMotionConfig): number {
  const hit = Number.isFinite(motion.hit_px) ? motion.hit_px : 44;
  return Math.max(44, hit);
}

function pickSize(rand: () => number, motion: BugMotionConfig): BugSizeId {
  const weights = SIZE_ORDER.map((id) => Math.max(0, specFor(motion, id).weight));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return "medium";
  let roll = rand() * total;
  for (let i = 0; i < SIZE_ORDER.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll < 0) return SIZE_ORDER[i] ?? "medium";
  }
  return "large";
}

function bounds(motion: BugMotionConfig): { min: number; max: number } {
  const inset = Number.isFinite(motion.inset) ? Math.max(0, Math.min(40, motion.inset)) : 6;
  return { min: inset, max: 100 - inset };
}

/** Seeded rng for direction changes. Same seed, same turns. */
export function bugMotionRand(seed: number): () => number {
  return mulberry32(seed ^ 0x51ed270b);
}

/** Seeded bugs. Positions are percents of the code area. */
export function spawnBugs(seed: number, count: number, motion: BugMotionConfig): BugBody[] {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const { min, max } = bounds(motion);
  const span = Math.max(0, max - min);
  const bugs: BugBody[] = [];
  const total = Math.max(0, Math.floor(count));
  for (let i = 0; i < total; i++) {
    const size = pickSize(rand, motion);
    bugs.push({
      size,
      x: min + rand() * span,
      y: min + rand() * span,
      angle: rand() * Math.PI * 2,
      untilTurn: specFor(motion, size).turn_ms,
    });
  }
  return bugs;
}

function wrapAngle(angle: number): number {
  const tau = Math.PI * 2;
  const wrapped = angle % tau;
  return wrapped < 0 ? wrapped + tau : wrapped;
}

/**
 * Integrate one bug. Speed is percent of the code area per second.
 * Reduced motion slows travel and waits longer between turns.
 */
export function stepBug(
  body: BugBody,
  dtMs: number,
  motion: BugMotionConfig,
  rand: () => number,
  reduced: boolean,
): BugBody {
  const spec = specFor(motion, body.size);
  const scale = scaleOf(motion, reduced);
  const dt = Math.max(0, dtMs) / 1000;
  const speed = spec.speed * scale;
  let x = body.x + Math.cos(body.angle) * speed * dt;
  let y = body.y + Math.sin(body.angle) * speed * dt;
  let angle = body.angle;
  const { min, max } = bounds(motion);
  if (x < min) {
    x = min;
    angle = Math.PI - angle;
  } else if (x > max) {
    x = max;
    angle = Math.PI - angle;
  }
  if (y < min) {
    y = min;
    angle = -angle;
  } else if (y > max) {
    y = max;
    angle = -angle;
  }
  let untilTurn = body.untilTurn - Math.max(0, dtMs);
  if (untilTurn <= 0) {
    angle = rand() * Math.PI * 2;
    untilTurn = spec.turn_ms / scale;
  }
  return { size: body.size, x, y, angle: wrapAngle(angle), untilTurn };
}
