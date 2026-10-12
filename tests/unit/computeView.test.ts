import { describe, expect, it } from "vitest";
import { computeView } from "@/game/view/computeView";

describe("computeView", () => {
  it("desktop 1920x914 @ dpr 1", () => {
    const v = computeView({
      areaCssW: 1920,
      areaCssH: 914,
      dpr: 1,
      portrait: false,
      focusX: 184,
      cameraX: null,
    });
    expect(v.scale).toBe(3);
    expect(v.viewW).toBe(427);
    expect(v.mode).toBe("full");
  });

  it("portrait iPhone 390x750 @ dpr 3", () => {
    const v = computeView({
      areaCssW: 390,
      areaCssH: 750,
      dpr: 3,
      portrait: true,
      focusX: 184,
      cameraX: null,
    });
    expect(v.scale).toBe(5);
    expect(v.viewW).toBe(234);
    expect(v.mode).toBe("crop");
  });

  it("1366x604 @ dpr 1", () => {
    const v = computeView({
      areaCssW: 1366,
      areaCssH: 604,
      dpr: 1,
      portrait: false,
      focusX: 205,
      cameraX: null,
    });
    expect(v.scale).toBe(2);
  });
});
