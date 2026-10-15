"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Loadout, StageId } from "../types";
import { PERSIST_KEY, PERSIST_VERSION } from "../config";
import { getCatalog, getRoom } from "../content";
import {
  DEFAULT_START_MINUTES,
  canSleepAt,
  minutesForPhaseStart,
  seekMinutes,
  sleepToNextMorning,
  timeBus,
  totalMinutesFromPersisted,
  type PhaseId,
  type SpeedPreset,
} from "../time";

type GameState = {
  stage: StageId;
  loadouts: Record<StageId, Loadout>;
  showCharacter: boolean;
  selectedSlot: string | null;
  hoveredSlot: string | null;
  cameraX: Record<StageId, number | null>;
  customizeOpen: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setStage: (s: StageId) => void;
  setSlotItem: (slotId: string, itemId: string | null) => void;
  cycleVariant: (slotId: string, dir: 1 | -1) => void;
  resetStage: () => void;
  selectSlot: (id: string | null) => void;
  setHover: (id: string | null) => void;
  setShowCharacter: (v: boolean) => void;
  setCameraX: (stage: StageId, x: number | null) => void;
  setCustomizeOpen: (v: boolean) => void;
  /** In-game minutes since day 1, 00:00. Persisted. */
  totalMinutes: number;
  /** Dev speed. Not persisted. */
  clockSpeed: SpeedPreset;
  /** Dev pause. Not persisted. */
  clockPaused: boolean;
  setTotalMinutes: (minutes: number) => void;
  setClockSpeed: (speed: SpeedPreset) => void;
  setClockPaused: (paused: boolean) => void;
  sleep: () => void;
  jumpToPhase: (phaseId: PhaseId) => void;
};

const emptyLoadouts = (): Record<StageId, Loadout> => ({
  student: {},
  junior: {},
  senior: {},
});

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      stage: "student",
      loadouts: emptyLoadouts(),
      showCharacter: true,
      selectedSlot: null,
      hoveredSlot: null,
      cameraX: { student: null, junior: null, senior: null },
      customizeOpen: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setStage: (s) => set({ stage: s, selectedSlot: null }),
      setSlotItem: (slotId, itemId) => {
        const stage = get().stage;
        set((st) => ({
          loadouts: {
            ...st.loadouts,
            [stage]: { ...st.loadouts[stage], [slotId]: itemId },
          },
        }));
      },
      cycleVariant: (slotId, dir) => {
        const stage = get().stage;
        const room = getRoom(stage);
        const slot = room.slots.find((s) => s.id === slotId);
        if (!slot) return;
        const { items } = getCatalog();
        const variants = items.filter((i) => slot.accepts.includes(i.category));
        if (variants.length === 0) return;
        const current =
          get().loadouts[stage][slotId] ?? slot.default ?? variants[0]!.id;
        const idx = variants.findIndex((v) => v.id === current);
        const next =
          variants[(idx + dir + variants.length) % variants.length]!.id;
        get().setSlotItem(slotId, next);
      },
      resetStage: () => {
        const stage = get().stage;
        set((st) => ({
          loadouts: { ...st.loadouts, [stage]: {} },
        }));
      },
      selectSlot: (id) => set({ selectedSlot: id }),
      setHover: (id) => set({ hoveredSlot: id }),
      setShowCharacter: (v) => set({ showCharacter: v }),
      setCameraX: (stage, x) =>
        set((st) => ({ cameraX: { ...st.cameraX, [stage]: x } })),
      setCustomizeOpen: (v) => set({ customizeOpen: v }),
      totalMinutes: DEFAULT_START_MINUTES,
      clockSpeed: 1,
      clockPaused: false,
      setTotalMinutes: (minutes) =>
        set({
          totalMinutes:
            typeof minutes === "number" && Number.isFinite(minutes)
              ? Math.max(0, minutes)
              : DEFAULT_START_MINUTES,
        }),
      setClockSpeed: (speed) => set({ clockSpeed: speed }),
      setClockPaused: (paused) => set({ clockPaused: paused }),
      sleep: () => {
        const current = get().totalMinutes;
        if (!canSleepAt(current)) return;
        const result = sleepToNextMorning(current);
        set({ totalMinutes: result.totalMinutes });
        for (const event of result.events) timeBus.emit(event);
      },
      jumpToPhase: (phaseId) => {
        const current = get().totalMinutes;
        const target = minutesForPhaseStart(current, phaseId);
        const result = seekMinutes(current, target);
        set({ totalMinutes: result.totalMinutes });
        for (const event of result.events) timeBus.emit(event);
      },
    }),
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      partialize: (s) => ({
        stage: s.stage,
        loadouts: s.loadouts,
        showCharacter: s.showCharacter,
        totalMinutes: s.totalMinutes,
      }),
      migrate: (persisted, version) => {
        const prev = (persisted ?? {}) as {
          stage?: StageId;
          loadouts?: Record<StageId, Loadout>;
          showCharacter?: boolean;
          totalMinutes?: unknown;
        };
        return {
          stage: prev.stage ?? "student",
          loadouts: prev.loadouts ?? emptyLoadouts(),
          showCharacter: prev.showCharacter ?? true,
          totalMinutes: totalMinutesFromPersisted(prev.totalMinutes, version),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function buildSlotIndex(stage: StageId): Record<string, number> {
  const room = getRoom(stage);
  const out: Record<string, number> = {};
  room.slots.forEach((s, i) => {
    out[s.id] = i;
  });
  return out;
}
