import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hungerLabel } from "@/game/life/hunger";
import {
  FOOD_TIP_ACTION,
  HUNGER_BOWL_BLINK,
  foodHungerTip,
  hungerBowlBlinkStyle,
} from "@/components/game/food-dock.config";

describe("food dock hunger blink", () => {
  it("names each hunger level on the tooltip", () => {
    expect(foodHungerTip("full")).toBe("Ăn · No");
    expect(foodHungerTip("peckish")).toBe("Ăn · Hơi đói");
    expect(foodHungerTip("hungry")).toBe("Ăn · Đói");
    expect(foodHungerTip("peckish")).toBe(`${FOOD_TIP_ACTION} · ${hungerLabel("peckish")}`);
  });

  it("blinks Hơi đói slowly and faintly, and Đói faster and stronger", () => {
    const peckish = HUNGER_BOWL_BLINK.peckish;
    const hungry = HUNGER_BOWL_BLINK.hungry;
    expect(peckish.durationMs).toBeGreaterThan(hungry.durationMs * 2);
    expect(peckish.minOpacity).toBeGreaterThan(hungry.minOpacity);
    expect(peckish.minBrightness).toBeGreaterThan(hungry.minBrightness);
    expect(peckish.stillOpacity).toBeGreaterThan(hungry.stillOpacity);
    expect(peckish.stillBrightness).toBeGreaterThan(hungry.stillBrightness);
    expect(peckish.minOpacity).toBeGreaterThan(0.7);
    expect(hungry.minOpacity).toBeLessThan(0.55);
  });

  it("leaves a full bowl still and publishes the pulse as custom properties", () => {
    expect(hungerBowlBlinkStyle("full")).toBeUndefined();
    expect(hungerBowlBlinkStyle("peckish")).toEqual({
      "--hunger-blink-ms": `${HUNGER_BOWL_BLINK.peckish.durationMs}ms`,
      "--hunger-min-opacity": String(HUNGER_BOWL_BLINK.peckish.minOpacity),
      "--hunger-min-brightness": String(HUNGER_BOWL_BLINK.peckish.minBrightness),
      "--hunger-still-opacity": String(HUNGER_BOWL_BLINK.peckish.stillOpacity),
      "--hunger-still-brightness": String(HUNGER_BOWL_BLINK.peckish.stillBrightness),
    });
    expect(hungerBowlBlinkStyle("hungry")?.["--hunger-blink-ms"]).toBe(
      `${HUNGER_BOWL_BLINK.hungry.durationMs}ms`,
    );
  });

  it("pulses with opacity and brightness, and holds a static tint when motion is reduced", () => {
    const css = readFileSync(join(process.cwd(), "src/components/game/food-dock.module.css"), "utf8");
    expect(css).toContain("opacity: var(--hunger-min-opacity)");
    expect(css).toContain("brightness(var(--hunger-min-brightness))");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("animation: none");
    expect(css).toContain("opacity: var(--hunger-still-opacity)");
    expect(css).toContain("brightness(var(--hunger-still-brightness))");
    expect(css).not.toMatch(/transform\s*:/);
  });

  it("drops the old hunger badge blink from globals.css without touching the tooltip rule", () => {
    const globals = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(globals).not.toContain("hunger-blink");
    expect(globals).not.toContain("hunger-badge");
    expect(globals).toContain(".ui-tooltip");
    const dock = readFileSync(join(process.cwd(), "src/components/game/FoodPopup.tsx"), "utf8");
    expect(dock).not.toContain("hungerArtFile");
    expect(dock).not.toContain("hunger-icon");
    expect(dock).toContain("foodHungerTip");
  });
});
