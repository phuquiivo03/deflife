import type { CSSProperties } from "react";
import animDoc from "../../../public/ui/m5_1/anim.json";
import sliceDoc from "../../../public/ui/m5_1/slices.json";
import { m51AssetPath } from "./assets";

/**
 * Dev A frames from `public/ui/m5_1/slices.json` and `anim.json`.
 * Drawn at 2× so each `_x2` pixel is one CSS pixel.
 * Button, sleep, store, and badge sheets belong to Dev B.
 */

export const M51_UI_SCALE = 2;

/** Approved `icon_btn_food` native size. The bowl graphic is the whole control. */
export const FOOD_NATIVE_PX = 24;

/** Approved `icon_action_eat` native size. */
export const ACTION_EAT_NATIVE_PX = 16;

/**
 * Confetti sprites are a few pixels inside each frame, so the banner
 * scatters this many copies at once (three rows across the game group).
 */
export const CONFETTI_COPY_COUNT = 24;

type BoxSlice = { left: number; top: number; right: number; bottom: number };

type BannerEntry = { size: [number, number]; slice: null; note: string };
type NotepadEntry = { size: [number, number]; slice: BoxSlice; note: string };
type HungerEntry = { size: [number, number]; note: string };
type SpriteAnim = {
  frameW: number;
  frameH: number;
  count: number;
  durationMs: number;
  layout: string;
  loop: boolean;
  note: string;
};

const bannerEntry = sliceDoc.ui_banner_v2 as BannerEntry;
const notepadEntry = sliceDoc.ui_window_notepad as NotepadEntry;
const hungerEntry = sliceDoc["icon_hunger_*"] as HungerEntry;
const confettiAnim = animDoc.fx_confetti as SpriteAnim;

const bannerText = bannerEntry.note.match(/x\s*(\d+)\.\.(\d+),\s*y\s*(\d+)\.\.(\d+)/);
if (!bannerText) {
  throw new Error("public/ui/m5_1/slices.json ui_banner_v2 note is missing the title box");
}
if (bannerEntry.slice !== null) {
  throw new Error("ui_banner_v2 is drawn whole; slices.json slice must stay null");
}
if (bannerEntry.size[0] !== 480 || bannerEntry.size[1] !== 64) {
  throw new Error("ui_banner_v2 native size must stay 480×64");
}

const notepadSlice = notepadEntry.slice;
if (
  notepadSlice.left !== 4 ||
  notepadSlice.top !== 14 ||
  notepadSlice.right !== 34 ||
  notepadSlice.bottom !== 4
) {
  throw new Error("ui_window_notepad slice must stay left 4, top 14, right 34, bottom 4");
}

const hungerOffset = hungerEntry.note.match(/offset\s*([+-]?\d+)\s*,\s*([+-]?\d+)/);
if (!hungerOffset) {
  throw new Error("public/ui/m5_1/slices.json icon_hunger_* note is missing the offset");
}
if (hungerEntry.size[0] !== 16 || hungerEntry.size[1] !== 16) {
  throw new Error("icon_hunger_* native size must stay 16×16");
}

if (
  confettiAnim.frameW !== 32 ||
  confettiAnim.frameH !== 32 ||
  confettiAnim.count !== 8 ||
  confettiAnim.durationMs !== 1500 ||
  confettiAnim.layout !== "horizontal" ||
  confettiAnim.loop !== false
) {
  throw new Error("fx_confetti must stay an 8-frame 32×32 sheet, 1500ms, no loop");
}

export const BANNER_TEXT_BOX = {
  x0: Number(bannerText[1]),
  x1: Number(bannerText[2]),
  y0: Number(bannerText[3]),
  y1: Number(bannerText[4]),
} as const;

export const HUNGER_OFFSET_NATIVE = {
  x: Number(hungerOffset[1]),
  y: Number(hungerOffset[2]),
} as const;

export const FX_CONFETTI = confettiAnim;

export type ConfettiPiece = {
  id: string;
  left: string;
  topPx: number;
  delayMs: number;
};

const CONFETTI_COLUMNS = 8;

export const CONFETTI_PIECES: readonly ConfettiPiece[] = Array.from(
  { length: CONFETTI_COPY_COUNT },
  (_, index) => {
    const col = index % CONFETTI_COLUMNS;
    const row = Math.floor(index / CONFETTI_COLUMNS);
    return {
      id: `c${index}`,
      left: `${4 + col * 11 + (row % 2) * 5}%`,
      topPx: row * 36,
      delayMs: -((index * 80) % 1100),
    };
  },
);

export function bannerArtFile(scale = M51_UI_SCALE): string {
  return scale === 2 ? "ui_banner_v2_x2.png" : "ui_banner_v2.png";
}

export function bannerMetrics(scale = M51_UI_SCALE) {
  return {
    scale,
    widthPx: bannerEntry.size[0] * scale,
    heightPx: bannerEntry.size[1] * scale,
    textX: BANNER_TEXT_BOX.x0 * scale,
    textY: BANNER_TEXT_BOX.y0 * scale,
    textW: (BANNER_TEXT_BOX.x1 - BANNER_TEXT_BOX.x0) * scale,
    textH: (BANNER_TEXT_BOX.y1 - BANNER_TEXT_BOX.y0) * scale,
  };
}

export function bannerPlateStyle(scale = M51_UI_SCALE): Record<`--${string}`, string> {
  const metrics = bannerMetrics(scale);
  return {
    "--banner-w": `${metrics.widthPx}px`,
    "--banner-h": `${metrics.heightPx}px`,
    "--banner-text-x": `${metrics.textX}px`,
    "--banner-text-y": `${metrics.textY}px`,
    "--banner-text-w": `${metrics.textW}px`,
    "--banner-text-h": `${metrics.textH}px`,
  };
}

export function confettiArtFile(scale = M51_UI_SCALE): string {
  return scale === 2 ? "fx_confetti_x2.png" : "fx_confetti.png";
}

export function confettiMetrics(scale = M51_UI_SCALE) {
  const framePx = FX_CONFETTI.frameW * scale;
  const steps = FX_CONFETTI.count - 1;
  return {
    scale,
    framePx,
    sheetPx: framePx * FX_CONFETTI.count,
    /** Last frame, so the sheet does not finish on an empty cell. */
    endPx: framePx * steps,
    steps,
    durationMs: FX_CONFETTI.durationMs,
    frames: FX_CONFETTI.count,
    loop: FX_CONFETTI.loop,
  };
}

export function confettiFieldStyle(scale = M51_UI_SCALE): Record<`--${string}`, string> {
  const metrics = confettiMetrics(scale);
  return {
    "--confetti-frame": `${metrics.framePx}px`,
    "--confetti-sheet": `${metrics.sheetPx}px`,
    "--confetti-end": `-${metrics.endPx}px`,
    "--confetti-duration": `${metrics.durationMs}ms`,
    "--confetti-timing": `steps(5, end), steps(${metrics.steps}, end)`,
    "--confetti-img": `url("${m51AssetPath(confettiArtFile(scale))}")`,
  };
}

export function notepadArtFile(scale = M51_UI_SCALE): string {
  return scale === 2 ? "ui_window_notepad_x2.png" : "ui_window_notepad.png";
}

export function notepadMetrics(scale = M51_UI_SCALE) {
  return {
    scale,
    leftPx: notepadSlice.left * scale,
    topPx: notepadSlice.top * scale,
    rightPx: notepadSlice.right * scale,
    bottomPx: notepadSlice.bottom * scale,
  };
}

/** 9-slice of the `_x2` sheet. The corner keeps the baked window buttons at 1:1. */
export function notepadFrameStyle(scale = M51_UI_SCALE): CSSProperties {
  const metrics = notepadMetrics(scale);
  const { topPx, rightPx, bottomPx, leftPx } = metrics;
  return {
    borderStyle: "solid",
    borderWidth: `${topPx}px ${rightPx}px ${bottomPx}px ${leftPx}px`,
    borderImage: `url("${m51AssetPath(notepadArtFile(scale))}") ${topPx} ${rightPx} ${bottomPx} ${leftPx} fill`,
    imageRendering: "pixelated",
    ["--notepad-top" as string]: `${topPx}px`,
    ["--notepad-right" as string]: `${rightPx}px`,
    ["--notepad-bottom" as string]: `${bottomPx}px`,
    ["--notepad-left" as string]: `${leftPx}px`,
  };
}

export function foodArtFile(scale = M51_UI_SCALE): string {
  return scale === 2 ? "icon_btn_food_x2.png" : "icon_btn_food.png";
}

export function hungerArtFile(level: "full" | "peckish" | "hungry", scale = M51_UI_SCALE): string {
  return scale === 2 ? `icon_hunger_${level}_x2.png` : `icon_hunger_${level}.png`;
}

export function actionEatArtFile(scale = M51_UI_SCALE): string {
  return scale === 2 ? "icon_action_eat_x2.png" : "icon_action_eat.png";
}

export function foodDockMetrics(scale = M51_UI_SCALE) {
  return {
    scale,
    foodPx: FOOD_NATIVE_PX * scale,
    hungerPx: hungerEntry.size[0] * scale,
    hungerX: HUNGER_OFFSET_NATIVE.x * scale,
    hungerY: HUNGER_OFFSET_NATIVE.y * scale,
    actionPx: ACTION_EAT_NATIVE_PX * scale,
  };
}

export function foodDockStyle(scale = M51_UI_SCALE): Record<`--${string}`, string> {
  const metrics = foodDockMetrics(scale);
  return {
    "--food-px": `${metrics.foodPx}px`,
    "--hunger-px": `${metrics.hungerPx}px`,
    "--hunger-x": `${metrics.hungerX}px`,
    "--hunger-y": `${metrics.hungerY}px`,
  };
}
