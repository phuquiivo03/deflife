import animDoc from "../../../public/ui/m5_1/anim.json";
import { BUTTON_UI_SCALE, buttonMetrics, type ButtonScale } from "@/components/ui/button/config";
import { m51AssetPath } from "@/game/life/assets";

/**
 * HUD sleep control. Frame count, size, and loop length come from
 * `public/ui/m5_1/anim.json` (`fx_zzz`). Distances that the art file does
 * not spell out live here and are documented in `docs/systems/buttons.md`.
 */

type SpriteAnim = {
  frameW: number;
  frameH: number;
  count: number;
  durationMs: number;
  layout: string;
  loop: boolean;
  note: string;
};

const fxZzz = animDoc.fx_zzz as SpriteAnim;

if (fxZzz.frameW !== 12 || fxZzz.frameH !== 12) {
  throw new Error("fx_zzz frames must be 12×12");
}
if (fxZzz.count !== 3 || fxZzz.durationMs !== 900) {
  throw new Error("fx_zzz must be 3 frames over 900ms");
}
if (fxZzz.layout !== "horizontal" || fxZzz.loop !== true) {
  throw new Error("fx_zzz must be a horizontal loop");
}

export const SLEEP_LABEL = "Đi ngủ";

/** Native size of `icon_btn_sleep`. The HUD draws the `_x2` sheet at 2×. */
export const SLEEP_ICON_NATIVE_PX = 24;

export const FX_ZZZ = fxZzz;

/**
 * How far the letters drift upward, in native pixels.
 * At 2× that is 16 CSS pixels over the 900ms loop.
 */
export const ZZZ_DRIFT_NATIVE_PX = 8;

/**
 * Top-right anchor of the zzz box, native pixels from the padding edge
 * (the bed's top-right). Negative values hang the sprite above that corner.
 */
export const ZZZ_ANCHOR_NATIVE = { right: -5, top: -7 } as const;

export function sleepIconFile(scale: ButtonScale = BUTTON_UI_SCALE): string {
  return scale === 2 ? "icon_btn_sleep_x2.png" : "icon_btn_sleep.png";
}

export function sleepZzzFile(scale: ButtonScale = BUTTON_UI_SCALE): string {
  return scale === 2 ? "fx_zzz_x2.png" : "fx_zzz.png";
}

export function sleepButtonMetrics(scale: ButtonScale = BUTTON_UI_SCALE) {
  const borderPx = buttonMetrics(scale).slicePx;
  const iconPx = SLEEP_ICON_NATIVE_PX * scale;
  const framePx = FX_ZZZ.frameW * scale;
  return {
    scale,
    iconPx,
    /** Outer box: the bed fills the 9-slice center, so the frame stays outside it. */
    buttonPx: iconPx + borderPx * 2,
    framePx,
    sheetPx: framePx * FX_ZZZ.count,
    driftPx: ZZZ_DRIFT_NATIVE_PX * scale,
    anchorRightPx: ZZZ_ANCHOR_NATIVE.right * scale,
    anchorTopPx: ZZZ_ANCHOR_NATIVE.top * scale,
    durationMs: FX_ZZZ.durationMs,
    frames: FX_ZZZ.count,
    loop: FX_ZZZ.loop,
  };
}

/** Custom properties for the floating zzz. The CSS module reads these. */
export function sleepZzzStyle(
  scale: ButtonScale = BUTTON_UI_SCALE,
): Record<`--${string}`, string> {
  const metrics = sleepButtonMetrics(scale);
  const duration = `${metrics.durationMs}ms`;
  return {
    "--zzz-top": `${metrics.anchorTopPx}px`,
    "--zzz-right": `${metrics.anchorRightPx}px`,
    "--zzz-frame": `${metrics.framePx}px`,
    "--zzz-sheet": `${metrics.sheetPx}px`,
    "--zzz-drift": `${metrics.driftPx}px`,
    "--zzz-duration": `${duration}, ${duration}`,
    "--zzz-timing": `steps(${metrics.frames}, end), linear`,
    "--zzz-img": `url("${m51AssetPath(sleepZzzFile(scale))}")`,
  };
}
