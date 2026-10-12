import { describe, expect, it } from "vitest";
import { getCatalog, getRoom } from "@/game/content";
import { resolveScene } from "@/game/layout/resolveScene";

const frames = (sprite: string) => {
  const sizes: Record<string, [number, number]> = {
    "furniture/junior/monitor": [61, 41],
    "furniture/junior/desk": [140, 72],
    "furniture/senior/standing_desk": [161, 70],
    "furniture/senior/dual_monitor": [94, 36],
  };
  const [w, h] = sizes[sprite] ?? [32, 32];
  return { w, h, pivotX: Math.floor(w / 2), pivotY: h };
};

describe("resolveScene", () => {
  const catalog = getCatalog();
  const slotIndex = Object.fromEntries(
    getRoom("junior").slots.map((s, i) => [s.id, i]),
  );

  it("junior monitor position with mock frames", () => {
    const { entries } = resolveScene(
      getRoom("junior"),
      catalog,
      {},
      frames,
      { showCharacter: false, slotIndex },
    );
    const mon = entries.find((e) => e.slotId === "display");
    expect(mon?.x).toBe(182);
    expect(mon?.y).toBe(56);
  });

  it("senior desk in junior room moves display socket", () => {
    const { placements } = resolveScene(
      getRoom("junior"),
      catalog,
      { desk: "senior.standing_desk" },
      frames,
      { showCharacter: false, slotIndex },
    );
    const desk = placements.find((p) => p.slotId === "desk");
    const display = placements.find((p) => p.slotId === "display");
    expect(desk?.anchor).toEqual([205, 153]);
    expect(display?.anchor).toEqual([207, 96]);
  });
});
