export {
  DEFAULT_START_MINUTES,
  GAME_MINUTES_PER_REAL_MS,
  MINUTE_EVENT_COALESCE_AFTER,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  PHASES,
  REAL_MS_PER_GAME_DAY,
  SLEEP_WAKE_MINUTE,
  SPEED_PRESETS,
  TINT_TRANSITION_MS,
  TIME_PERSIST_VERSION,
  type PhaseDef,
  type PhaseId,
  type PhaseTint,
  type SpeedPreset,
} from "./config";

export { createTimeBus, timeBus, type TimeBus } from "./bus";

export {
  advanceMinutes,
  canSleepAt,
  formatClock,
  minutesForPhaseStart,
  phaseAtMinuteOfDay,
  phaseById,
  phaseContains,
  realMsToGameMinutes,
  seekMinutes,
  sleepToNextMorning,
  snapshot,
  totalMinutesFromPersisted,
  type AdvanceResult,
} from "./clock";

export { createTimeLoop, type TimeLoop, type TimeLoopOptions } from "./loop";

export type { ClockSnapshot, TimeEvent, TimeEventOf, TimeEventType } from "./types";
