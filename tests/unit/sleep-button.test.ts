import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { BUTTON_UI_SCALE, buttonMetrics } from "@/components/ui/button/config";
import { m51AssetPath } from "@/game/life/assets";
import {
  FX_ZZZ,
  SLEEP_ICON_NATIVE_PX,
  SLEEP_LABEL,
  ZZZ_ANCHOR_NATIVE,
  ZZZ_DRIFT_NATIVE_PX,
  sleepButtonMetrics,
  sleepIconFile,
  sleepZzzFile,
  sleepZzzStyle,
} from "@/components/game/sleep-button.config";
import animDoc from "../../public/ui/m5_1/anim.json";
import sliceDoc from "../../public/ui/m5_1/slices.json";

const SHARED_SLICE_KEYS = [
  "ui_window_notepad",
  "ui_btn_*",
  "ui_banner_v2",
  "ui_badge_unread_lg",
  "icon_hunger_*",
] as const;

function readPng(file: string): PNG {
  return PNG.sync.read(readFileSync(join(process.cwd(), "public/ui/m5_1", file)));
}

function opaqueCount(png: PNG, x0: number, y0: number, width: number, height: number): number {
  let count = 0;
  for (let y = y0; y < y0 + height; y += 1) {
    for (let x = x0; x < x0 + width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] !== 0) count += 1;
    }
  }
  return count;
}

describe("sleep button art", () => {
  it("keeps every shared slices.json key", () => {
    for (const key of SHARED_SLICE_KEYS) {
      expect(sliceDoc).toHaveProperty(key);
    }
  });

  it("reads the zzz loop from anim.json", () => {
    expect(animDoc.fx_zzz).toEqual(FX_ZZZ);
    expect(FX_ZZZ).toMatchObject({
      frameW: 12,
      frameH: 12,
      count: 3,
      durationMs: 900,
      layout: "horizontal",
      loop: true,
    });
    expect(animDoc.fx_confetti.frameW).toBe(32);
  });

  it("ships the bed and the three-frame zzz sheet at native and 2×", () => {
    for (const scale of [1, 2] as const) {
      const icon = readPng(sleepIconFile(scale));
      expect(icon.width).toBe(SLEEP_ICON_NATIVE_PX * scale);
      expect(icon.height).toBe(SLEEP_ICON_NATIVE_PX * scale);
      expect(existsSync(join(process.cwd(), "public/ui/m5_1", sleepIconFile(scale)))).toBe(true);

      const zzz = readPng(sleepZzzFile(scale));
      const frame = FX_ZZZ.frameW * scale;
      expect(zzz.width).toBe(frame * FX_ZZZ.count);
      expect(zzz.height).toBe(frame);
      for (let index = 0; index < FX_ZZZ.count; index += 1) {
        expect(opaqueCount(zzz, index * frame, 0, frame, frame)).toBeGreaterThan(0);
      }
    }
  });
});

describe("sleep button metrics", () => {
  it("fits the 2× bed inside the icon button face", () => {
    const metrics = sleepButtonMetrics();
    const border = buttonMetrics(BUTTON_UI_SCALE).slicePx;
    expect(metrics.iconPx).toBe(48);
    expect(metrics.buttonPx).toBe(metrics.iconPx + border * 2);
    expect(metrics.framePx).toBe(24);
    expect(metrics.sheetPx).toBe(72);
    expect(metrics.durationMs).toBe(900);
    expect(metrics.frames).toBe(3);
    expect(metrics.driftPx).toBe(ZZZ_DRIFT_NATIVE_PX * BUTTON_UI_SCALE);
    expect(metrics.anchorRightPx).toBe(ZZZ_ANCHOR_NATIVE.right * BUTTON_UI_SCALE);
    expect(metrics.anchorTopPx).toBe(ZZZ_ANCHOR_NATIVE.top * BUTTON_UI_SCALE);
    expect(SLEEP_LABEL).toBe("Đi ngủ");
  });

  it("publishes the loop timing as custom properties", () => {
    const style = sleepZzzStyle();
    expect(style["--zzz-duration"]).toBe("900ms, 900ms");
    expect(style["--zzz-timing"]).toBe("steps(3, end), linear");
    expect(style["--zzz-frame"]).toBe("24px");
    expect(style["--zzz-sheet"]).toBe("72px");
    expect(style["--zzz-drift"]).toBe("16px");
    expect(style["--zzz-img"]).toBe(`url("${m51AssetPath("fx_zzz_x2.png")}")`);
  });

  it("uses the shared tooltip and keeps the Đi ngủ aria-label", () => {
    const source = readFileSync(join(process.cwd(), "src/components/game/SleepButton.tsx"), "utf8");
    expect(source).toContain("TooltipContent");
    expect(source).toContain("aria-label={SLEEP_LABEL}");
    expect(source).toContain("{SLEEP_LABEL}");
    expect(source).not.toContain("title=");
  });

  it("holds the first zzz frame when motion is reduced", () => {
    const css = readFileSync(
      join(process.cwd(), "src/components/game/sleep-button.module.css"),
      "utf8",
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/animation:\s*none/);
    expect(css).toContain("background-position: 0 0");
  });
});
