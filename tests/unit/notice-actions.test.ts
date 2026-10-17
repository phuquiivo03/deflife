import { afterEach, describe, expect, it, vi } from "vitest";
import { LIFE } from "@/game/life/content";
import { monthKey } from "@/game/life/logic";
import { useGameStore } from "@/game/state/store";

const RENT = LIFE.rent.student;
const MORNING = 8 * 60;
const EVENING = 18 * 60;
const NEXT_WAKE = 1 * 24 * 60 + 6 * 60;

function oweRent() {
  const career = useGameStore.getState().career;
  const key = monthKey(career.players.game_day);
  useGameStore.setState({
    foodOpen: false,
    storeOpen: false,
    careerPanel: null,
    totalMinutes: MORNING,
    career: {
      ...career,
      players: { ...career.players, money: 3_000_000 },
      life: { ...career.life, rentIssuedKey: key, paidRentKey: null, rentDebtDays: 2 },
    },
  });
  return key;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runNoticeAction", () => {
  it("opens the food modal for eat and does not pay rent", () => {
    const key = oweRent();
    useGameStore.getState().runNoticeAction("eat");
    const next = useGameStore.getState();
    expect(next.foodOpen).toBe(true);
    expect(next.career.players.money).toBe(3_000_000);
    expect(next.career.life.paidRentKey).toBeNull();
    expect(next.career.life.rentIssuedKey).toBe(key);
  });

  it("sleeps only when the HUD bed would", () => {
    oweRent();
    useGameStore.getState().runNoticeAction("sleep");
    expect(useGameStore.getState().totalMinutes).toBe(MORNING);
    expect(useGameStore.getState().career.players.money).toBe(3_000_000);

    useGameStore.setState({ totalMinutes: EVENING });
    useGameStore.getState().runNoticeAction("sleep");
    expect(useGameStore.getState().totalMinutes).toBe(NEXT_WAKE);
    expect(useGameStore.getState().career.life.paidRentKey).toBeNull();
  });

  it("pays outstanding rent only for payRent", () => {
    const key = oweRent();
    useGameStore.getState().runNoticeAction("payRent");
    const next = useGameStore.getState();
    expect(next.career.players.money).toBe(3_000_000 - RENT);
    expect(next.career.life.paidRentKey).toBe(key);
    expect(next.foodOpen).toBe(false);
  });

  it("warns and does nothing for an unknown id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    oweRent();
    useGameStore.getState().runNoticeAction("nope" as "eat");
    const next = useGameStore.getState();
    expect(next.career.players.money).toBe(3_000_000);
    expect(next.career.life.paidRentKey).toBeNull();
    expect(next.foodOpen).toBe(false);
    expect(next.storeOpen).toBe(false);
    expect(next.careerPanel).toBeNull();
    expect(next.totalMinutes).toBe(MORNING);
    expect(warn).toHaveBeenCalledWith('Unknown notice action "nope"');
  });
});
