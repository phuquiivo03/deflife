import { advanceMinutes, realMsToGameMinutes } from "./clock";
import type { TimeEvent } from "./types";

export type TimeLoop = {
  start(nowMs: number): void;
  tick(nowMs: number): void;
  /** Write the fractional minute to storage even if no boundary was crossed. */
  commit(): void;
};

export type TimeLoopOptions = {
  getTotalMinutes: () => number;
  setTotalMinutes: (minutes: number) => void;
  getSpeed: () => number;
  isPaused: () => boolean;
  emit: (event: TimeEvent) => void;
};

/**
 * Single clock driver. Call `tick` with a monotonic millisecond timestamp.
 * Speed and pause are read each tick so the UI can change them without
 * recreating the loop. Large gaps (background tabs) are applied in one tick.
 */
export function createTimeLoop(options: TimeLoopOptions): TimeLoop {
  let lastMs = 0;
  let started = false;
  let synced = 0;

  const pullExternal = () => {
    const external = options.getTotalMinutes();
    if (external !== synced) synced = external;
    return external;
  };

  return {
    start(nowMs) {
      lastMs = nowMs;
      started = true;
      synced = options.getTotalMinutes();
    },
    tick(nowMs) {
      if (!started) {
        this.start(nowMs);
        return;
      }
      const external = pullExternal();
      const dt = nowMs - lastMs;
      lastMs = nowMs;
      if (!(dt > 0) || options.isPaused()) return;
      const speed = options.getSpeed();
      if (!(speed > 0)) return;
      const result = advanceMinutes(synced, realMsToGameMinutes(dt, speed));
      synced = result.totalMinutes;
      if (synced !== external) options.setTotalMinutes(synced);
      for (const event of result.events) options.emit(event);
    },
    commit() {
      const external = pullExternal();
      if (synced !== external) options.setTotalMinutes(synced);
    },
  };
}
