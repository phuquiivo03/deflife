"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Loadout, StageId } from "../types";
import { PERSIST_KEY, PERSIST_VERSION } from "../config";
import { getCatalog, getRoom } from "../content";
import {
  applyAccept,
  applyDayStarted,
  applyStudy,
  applyWake,
  changeMoney,
  defaultCareer,
  ensureTodayBoard as ensureBoardState,
  fillEnergy,
  grantRawXp,
  syncPlayerClock,
  xpNeededForNextLevel,
} from "../career/actions";
import { SIM_CATALOG } from "../career/content";
import type { CareerState } from "../career/types";
import { playCueKey } from "../audio/client";
import { gameBus } from "../events/bus";
import type { GameEvent } from "../events/types";
import { LocalStorageAdapter, toStateStorage } from "../storage/adapter";
import { migrateSave } from "../storage/migrate";
import {
  DEFAULT_START_MINUTES,
  advanceMinutes,
  canSleepAt,
  minutesForPhaseStart,
  seekMinutes,
  sleepToNextMorning,
  snapshot,
  timeBus,
  type PhaseId,
  type SpeedPreset,
} from "../time";

function emitGame(events: readonly GameEvent[]) {
  for (const event of events) gameBus.emit(event);
}

export type CareerPanel = "study" | "jobs" | "skills";

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
  career: CareerState;
  careerPanel: CareerPanel | null;
  fastForward: boolean;
  openCareerPanel: (panel: CareerPanel) => void;
  closeCareerPanel: () => void;
  ensureTodayBoard: () => void;
  onDayStarted: (day: number, totalMinutes: number) => void;
  onWake: () => void;
  buyCourse: (activityId: string) => void;
  acceptJob: (jobId: string) => void;
  debugAddMoney: () => void;
  debugFillEnergy: () => void;
  debugLevelUp: () => void;
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
      setStage: (s) =>
        set((st) => ({
          stage: s,
          selectedSlot: null,
          career: { ...st.career, players: { ...st.career.players, stage: s } },
        })),
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
      career: defaultCareer(1, DEFAULT_START_MINUTES, "student", SIM_CATALOG),
      careerPanel: null,
      fastForward: false,
      openCareerPanel: (panel) => set({ careerPanel: panel }),
      closeCareerPanel: () => set({ careerPanel: null }),
      ensureTodayBoard: () => {
        const current = get();
        const snap = snapshot(current.totalMinutes);
        const synced = syncPlayerClock(
          current.career,
          snap.day,
          snap.minuteOfDay,
          current.stage,
        );
        const result = ensureBoardState(synced, snap.day, SIM_CATALOG);
        set({ career: result.state });
        emitGame(result.events);
      },
      onDayStarted: (day, totalMinutes) => {
        const current = get();
        const minuteOfDay = snapshot(totalMinutes).minuteOfDay;
        const result = applyDayStarted(
          current.career,
          day,
          minuteOfDay,
          current.stage,
          SIM_CATALOG,
        );
        set({ career: result.state });
        emitGame(result.events);
      },
      onWake: () => {
        const result = applyWake(get().career, SIM_CATALOG);
        set({ career: result.state });
        emitGame(result.events);
      },
      buyCourse: (activityId) => {
        const current = get();
        const snapNow = snapshot(current.totalMinutes);
        const synced = syncPlayerClock(
          current.career,
          snapNow.day,
          snapNow.minuteOfDay,
          current.stage,
        );
        const result = applyStudy(synced, activityId, SIM_CATALOG);
        if (result.error) return;
        const advanced = advanceMinutes(current.totalMinutes, result.minutes);
        const snap = snapshot(advanced.totalMinutes);
        set({
          totalMinutes: advanced.totalMinutes,
          career: syncPlayerClock(result.state, snap.day, snap.minuteOfDay, current.stage),
          fastForward: true,
        });
        emitGame(result.events);
        for (const event of advanced.events) timeBus.emit(event);
        window.setTimeout(() => {
          useGameStore.setState({ fastForward: false });
        }, 800);
      },
      acceptJob: (jobId) => {
        const current = get();
        const snap = snapshot(current.totalMinutes);
        const synced = syncPlayerClock(
          current.career,
          snap.day,
          snap.minuteOfDay,
          current.stage,
        );
        const result = applyAccept(synced, jobId, SIM_CATALOG);
        if (result.error) {
          playCueKey("jobFailed");
          return;
        }
        set({ career: result.state });
        emitGame(result.events);
      },
      debugAddMoney: () => {
        const result = changeMoney(get().career, 500_000);
        set({ career: result.state });
        emitGame(result.events);
      },
      debugFillEnergy: () => {
        const result = fillEnergy(get().career, SIM_CATALOG);
        set({ career: result.state });
        emitGame(result.events);
      },
      debugLevelUp: () => {
        const need = xpNeededForNextLevel(get().career, "frontend", SIM_CATALOG);
        if (need <= 0) return;
        const result = grantRawXp(get().career, "frontend", need, SIM_CATALOG);
        set({ career: result.state });
        emitGame(result.events);
      },
    }),
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => toStateStorage(new LocalStorageAdapter())),
      partialize: (s) => {
        const snap = snapshot(s.totalMinutes);
        return {
          stage: s.stage,
          loadouts: s.loadouts,
          showCharacter: s.showCharacter,
          totalMinutes: s.totalMinutes,
          career: syncPlayerClock(s.career, snap.day, snap.minuteOfDay, s.stage),
        };
      },
      migrate: (persisted, version) => migrateSave(persisted, version),
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
