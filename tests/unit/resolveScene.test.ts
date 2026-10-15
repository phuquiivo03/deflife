import { describe, expect, it } from "vitest";
import { getCatalog, getRoom } from "@/game/content";
import { resolveScene } from "@/game/layout/resolveScene";

const frames = (sprite: string) => {
  const sizes: Record<string, [number, number]> = {
    "furniture/junior/monitor": [61, 41],
    "furniture/junior/desk": [140, 54],
    "furniture/senior/standing_desk": [161, 70],
    "furniture/senior/dual_monitor": [94, 36],
    "furniture/student/laptop": [48, 36],
    "furniture/student/mouse": [9, 7],
    "character/derived/char_sit_back": [40, 72],
    "character/derived/char_sit_floor": [41, 72],
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

  it("student room sits on the floor in front of the laptop", () => {
    const room = getRoom("student");
    const { entries } = resolveScene(room, catalog, {}, frames, {
      showCharacter: true,
      slotIndex: Object.fromEntries(room.slots.map((s, i) => [s.id, i])),
    });
    expect(entries.some((e) => e.slotId === "seat")).toBe(false);
    const laptop = entries.find((e) => e.slotId === "display");
    const mouse = entries.find((e) => e.slotId === "mouse");
    const character = entries.find((e) => e.key === "character");
    expect(laptop?.x).toBe(238);
    expect(laptop?.y).toBe(78);
    expect(character?.sprite).toBe("character/derived/char_sit_floor");
    expect(character?.x).toBe(242);
    expect(character?.y).toBe(76);
    const order = entries.map((e) => e.key);
    expect(order.indexOf("display:sprite")).toBeLessThan(order.indexOf("character"));
    expect(order.indexOf("character")).toBeLessThan(order.indexOf("mouse:sprite"));
    expect(mouse?.x).toBe(288);
    expect(mouse?.y).toBe(106);
  });

  it("a chair replaces the student floor sit", () => {
    const room = getRoom("student");
    const { entries, placements } = resolveScene(
      room,
      catalog,
      { seat: "student.plastic_stool" },
      frames,
      {
        showCharacter: true,
        slotIndex: Object.fromEntries(room.slots.map((s, i) => [s.id, i])),
      },
    );
    const seat = placements.find((p) => p.slotId === "seat");
    const character = entries.find((e) => e.key === "character");
    expect(seat?.anchor).toEqual([262, 139]);
    expect(character?.y).not.toBe(76);
  });
});
