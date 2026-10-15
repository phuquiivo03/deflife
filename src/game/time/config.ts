/**
 * Day/night clock configuration.
 * All phase bounds, durations, and speed presets live here so a new phase
 * is a data change, not a logic change.
 */

/** 1 in-game day = 10 real minutes. */
export const REAL_MS_PER_GAME_DAY = 10 * 60 * 1000;

export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/**
 * In-game minutes per real millisecond at speed ×1.
 * Do not multiply this back by `REAL_MS_PER_GAME_DAY` — it is not an exact
 * binary fraction. Use `realMsToGameMinutes` for conversion.
 */
export const GAME_MINUTES_PER_REAL_MS = MINUTES_PER_DAY / REAL_MS_PER_GAME_DAY;

/**
 * Above this many crossed minutes in one tick, `minute` events coalesce to one
 * per hour segment. Hour, phase, and day boundaries are still emitted each time
 * they are crossed (fast-forward and background-tab catch-up).
 */
export const MINUTE_EVENT_COALESCE_AFTER = 2 * MINUTES_PER_DAY;

/** Fresh save and v1 migration land here: day 1, 08:00, Sáng. */
export const DEFAULT_START_MINUTES = 8 * MINUTES_PER_HOUR;

/** Sleep skips ahead to this minute-of-day on the next day. */
export const SLEEP_WAKE_MINUTE = 6 * MINUTES_PER_HOUR;

/** How long a phase tint takes to crossfade. Snaps when reduced motion is set. */
export const TINT_TRANSITION_MS = 1200;

export const SPEED_PRESETS = [1, 10, 60] as const;
export type SpeedPreset = (typeof SPEED_PRESETS)[number];

export type PhaseId = "morning" | "noon" | "evening" | "night";

export type PhaseTint = {
  r: number;
  g: number;
  b: number;
  /** 0–1 strength of the source-over wash on the room canvas. */
  a: number;
};

export type PhaseDef = {
  id: PhaseId;
  label: string;
  /**
   * Pixel-icon key. Art lives at `public/ui/icons/icon_<iconKey>.png`
   * and `icon_<iconKey>_x4.png`. The HUD shows `emoji` until those files exist.
   */
  iconKey: PhaseId;
  emoji: string;
  /**
   * Inclusive start, exclusive end, in minutes from midnight.
   * When `endMinute` <= `startMinute` the range wraps past midnight (Khuya).
   */
  startMinute: number;
  endMinute: number;
  sleepAllowed: boolean;
  tint: PhaseTint;
};

export const PHASES: readonly PhaseDef[] = [
  {
    id: "morning",
    label: "Sáng",
    iconKey: "morning",
    emoji: "🌅",
    startMinute: 5 * MINUTES_PER_HOUR,
    endMinute: 11 * MINUTES_PER_HOUR,
    sleepAllowed: false,
    tint: { r: 255, g: 186, b: 96, a: 0.22 },
  },
  {
    id: "noon",
    label: "Trưa",
    iconKey: "noon",
    emoji: "☀️",
    startMinute: 11 * MINUTES_PER_HOUR,
    endMinute: 17 * MINUTES_PER_HOUR,
    sleepAllowed: false,
    tint: { r: 255, g: 228, b: 170, a: 0.3 },
  },
  {
    id: "evening",
    label: "Tối",
    iconKey: "evening",
    emoji: "🌆",
    startMinute: 17 * MINUTES_PER_HOUR,
    endMinute: 22 * MINUTES_PER_HOUR,
    sleepAllowed: true,
    tint: { r: 86, g: 54, b: 140, a: 0.28 },
  },
  {
    id: "night",
    label: "Khuya",
    iconKey: "night",
    emoji: "🌙",
    startMinute: 22 * MINUTES_PER_HOUR,
    endMinute: 5 * MINUTES_PER_HOUR,
    sleepAllowed: true,
    tint: { r: 8, g: 14, b: 52, a: 0.58 },
  },
];

/** Persist version that first stored `totalMinutes`. Older saves migrate. */
export const TIME_PERSIST_VERSION = 2;
