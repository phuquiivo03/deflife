import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import {
  BUTTON_ASSET_FILES,
  BUTTON_ASSET_KEYS,
  BUTTON_PRESS_FACE_SHIFT_PX,
  BUTTON_SCALES,
  BUTTON_STATES,
  BUTTON_UI_SCALE,
  BUTTON_VARIANTS,
  buttonAssetFile,
  buttonAssetPath,
  buttonMetrics,
  pixelButtonStyle,
} from "@/components/ui/button/config";
import sliceDoc from "../../public/ui/m5_1/slices.json";

function readPng(file: string): PNG {
  return PNG.sync.read(readFileSync(join(process.cwd(), "public/ui/m5_1", file)));
}

function rowTransparent(png: PNG, y: number): boolean {
  for (let x = 0; x < png.width; x += 1) {
    if (png.data[(y * png.width + x) * 4 + 3] !== 0) return false;
  }
  return true;
}

describe("pixel button assets", () => {
  it("reads the 9-slice and the 2px face shift from slices.json", () => {
    expect(sliceDoc["ui_btn_*"].slice).toBe(8);
    expect(sliceDoc["ui_btn_*"].size).toEqual([24, 24]);
    expect(sliceDoc["ui_btn_*"].note).toContain("offset label");
    expect(BUTTON_PRESS_FACE_SHIFT_PX).toBe(2);
  });

  it("ships native and _x2 skins for every variant and state", () => {
    expect(BUTTON_ASSET_FILES).toHaveLength(24);
    for (const variant of BUTTON_VARIANTS) {
      expect(BUTTON_ASSET_KEYS[variant]).toBe(`ui_btn_${variant}`);
      for (const state of BUTTON_STATES) {
        for (const scale of BUTTON_SCALES) {
          const file = buttonAssetFile(variant, state, scale);
          expect(buttonAssetPath(variant, state, scale)).toBe(`/ui/m5_1/${file}`);
          expect(existsSync(join(process.cwd(), "public/ui/m5_1", file))).toBe(true);
          const png = readPng(file);
          expect(png.width).toBe(24 * scale);
          expect(png.height).toBe(24 * scale);
        }
      }
    }
  });

  it("draws the pressed face 2 native pixels lower", () => {
    for (const variant of BUTTON_VARIANTS) {
      const normal = readPng(buttonAssetFile(variant, "normal", 1));
      const pressed = readPng(buttonAssetFile(variant, "pressed", 1));
      const pressedX2 = readPng(buttonAssetFile(variant, "pressed", 2));
      expect(rowTransparent(normal, 0)).toBe(false);
      for (let y = 0; y < BUTTON_PRESS_FACE_SHIFT_PX; y += 1) {
        expect(rowTransparent(pressed, y)).toBe(true);
      }
      for (let y = 0; y < BUTTON_PRESS_FACE_SHIFT_PX * 2; y += 1) {
        expect(rowTransparent(pressedX2, y)).toBe(true);
      }
    }
  });
});

describe("pixel button chrome", () => {
  it("scales the slice and the label shift together", () => {
    expect(buttonMetrics(1)).toMatchObject({ slicePx: 8, pressPx: 2, iconPx: 24, minHeightPx: 24 });
    expect(buttonMetrics(BUTTON_UI_SCALE)).toMatchObject({
      slicePx: 16,
      pressPx: 4,
      iconPx: 48,
      minHeightPx: 48,
    });
  });

  it("points each variant at its own normal, hover, and pressed sheets", () => {
    const style = pixelButtonStyle("danger");
    expect(style["--btn-slice"]).toBe("16 fill");
    expect(style["--btn-press"]).toBe("4px");
    expect(style["--btn-img"]).toBe('url("/ui/m5_1/ui_btn_danger_normal_x2.png")');
    expect(style["--btn-img-hover"]).toBe('url("/ui/m5_1/ui_btn_danger_hover_x2.png")');
    expect(style["--btn-img-pressed"]).toBe('url("/ui/m5_1/ui_btn_danger_pressed_x2.png")');
    expect(style["--btn-ink"]).toBe("#FFFFFF");
    expect(pixelButtonStyle("secondary")["--btn-ink"]).toBe("#2A2548");
  });

  it("drops the label with the face and does not translate the button box", () => {
    const css = readFileSync(
      join(process.cwd(), "src/components/ui/button/pixel-button.module.css"),
      "utf8",
    );
    expect(css).toContain(".pixelButton:active:not(:disabled) > *");
    expect(css).toContain("transform: translateY(var(--btn-press))");
    expect(css).not.toMatch(/\.pixelButton:active:not\(:disabled\)\s*\{[^}]*transform:/);
  });
});
