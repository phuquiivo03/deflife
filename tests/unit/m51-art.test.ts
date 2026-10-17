import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import {
  ACTION_EAT_NATIVE_PX,
  BANNER_TEXT_BOX,
  CONFETTI_COPY_COUNT,
  CONFETTI_PIECES,
  FOOD_NATIVE_PX,
  FX_CONFETTI,
  HUNGER_OFFSET_NATIVE,
  M51_UI_SCALE,
  actionEatArtFile,
  bannerArtFile,
  bannerMetrics,
  bannerPlateStyle,
  confettiArtFile,
  confettiFieldStyle,
  confettiMetrics,
  foodArtFile,
  foodDockMetrics,
  foodDockStyle,
  notepadArtFile,
  notepadFrameStyle,
  notepadMetrics,
} from "@/game/life/m51-art";
import animDoc from "../../public/ui/m5_1/anim.json";
import sliceDoc from "../../public/ui/m5_1/slices.json";

function readPng(file: string): PNG {
  return PNG.sync.read(readFileSync(join(process.cwd(), "public/ui/m5_1", file)));
}

describe("M5.1 final art metrics", () => {
  it("keeps the banner whole and puts the title in the documented box", () => {
    expect(sliceDoc.ui_banner_v2.slice).toBeNull();
    expect(BANNER_TEXT_BOX).toEqual({ x0: 40, x1: 440, y0: 10, y1: 46 });
    expect(bannerMetrics()).toMatchObject({
      widthPx: 960,
      heightPx: 128,
      textX: 80,
      textY: 20,
      textW: 800,
      textH: 72,
    });
    const plate = bannerPlateStyle();
    expect(plate["--banner-w"]).toBe("960px");
    expect(plate["--banner-text-x"]).toBe("80px");
    const art = readPng(bannerArtFile());
    expect(art.width).toBe(960);
    expect(art.height).toBe(128);
  });

  it("scatters many confetti copies from the 8-frame sheet", () => {
    expect(animDoc.fx_confetti).toEqual(FX_CONFETTI);
    expect(FX_CONFETTI.loop).toBe(false);
    const metrics = confettiMetrics();
    expect(metrics).toMatchObject({
      framePx: 64,
      sheetPx: 512,
      endPx: 448,
      steps: 7,
      durationMs: 1500,
      frames: 8,
    });
    expect(CONFETTI_COPY_COUNT).toBeGreaterThanOrEqual(24);
    expect(CONFETTI_PIECES).toHaveLength(CONFETTI_COPY_COUNT);
    const field = confettiFieldStyle();
    expect(field["--confetti-frame"]).toBe("64px");
    expect(field["--confetti-sheet"]).toBe("512px");
    expect(field["--confetti-end"]).toBe("-448px");
    expect(field["--confetti-duration"]).toBe("1500ms");
    expect(field["--confetti-timing"]).toBe("steps(5, end), steps(7, end)");
    expect(field["--confetti-img"]).toContain(confettiArtFile());
    const sheet = readPng(confettiArtFile());
    expect(sheet.width).toBe(metrics.sheetPx);
    expect(sheet.height).toBe(metrics.framePx);
  });

  it("9-slices the notepad so the baked window buttons stay 1:1", () => {
    expect(sliceDoc.ui_window_notepad.slice).toEqual({ left: 4, top: 14, right: 34, bottom: 4 });
    expect(notepadMetrics()).toEqual({ scale: M51_UI_SCALE, leftPx: 8, topPx: 28, rightPx: 68, bottomPx: 8 });
    const frame = notepadFrameStyle();
    expect(frame.borderWidth).toBe("28px 68px 8px 8px");
    expect(frame.borderImage).toContain(notepadArtFile());
    expect(frame.borderImage).toContain("28 68 8 8 fill");
    const art = readPng(notepadArtFile());
    expect(art.width).toBe(128);
    expect(art.height).toBe(80);
  });

  it("draws the rice bowl as the button and overlays hunger at the art offset", () => {
    expect(HUNGER_OFFSET_NATIVE).toEqual({ x: 12, y: -4 });
    expect(foodDockMetrics()).toMatchObject({
      foodPx: FOOD_NATIVE_PX * M51_UI_SCALE,
      hungerPx: 32,
      hungerX: 24,
      hungerY: -8,
      actionPx: ACTION_EAT_NATIVE_PX * M51_UI_SCALE,
    });
    const style = foodDockStyle();
    expect(style["--food-px"]).toBe("48px");
    expect(style["--hunger-x"]).toBe("24px");
    expect(style["--hunger-y"]).toBe("-8px");
    expect(style["--hunger-px"]).toBe("32px");
    expect(readPng(foodArtFile()).width).toBe(48);
    expect(readPng(actionEatArtFile()).width).toBe(32);
    expect(foodDockStyle()["--food-px"]).not.toContain("ui_btn");
  });
});
