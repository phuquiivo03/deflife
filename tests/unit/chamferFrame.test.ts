import { describe, expect, it } from "vitest";
import { canvasCssWithinFrame, CHAMFER_LAYERS } from "@/lib/chamfer-frame";

describe("chamfer frame", () => {
  it("has no dark inner layer between the purple body and the canvas", () => {
    expect(CHAMFER_LAYERS).not.toHaveProperty("f4");
    expect(CHAMFER_LAYERS.f3.paddingPx).toBeGreaterThan(0);
    expect(CHAMFER_LAYERS.f5.paddingPx).toBe(0);
  });

  it("leaves a canvas that already fits the slot at its integer size", () => {
    expect(canvasCssWithinFrame(427, 240, 480, 270)).toEqual({ cssW: 427, cssH: 240 });
  });

  it("shrinks the canvas so the frame stays inside a narrow slot", () => {
    const fitted = canvasCssWithinFrame(427, 240, 374, 210);
    expect(fitted.cssW).toBeLessThan(374);
    expect(fitted.cssH).toBeLessThan(210);
    expect(fitted.cssW / fitted.cssH).toBeCloseTo(427 / 240, 5);
  });
});
