import gameConfig from "../../../config/game_config.json";
import { clamp01 } from "./manifest";

/** Previous key. Read once, then replaced by `AUDIO_STORAGE_KEY`. */
export const LEGACY_AUDIO_STORAGE_KEY = "devlife:audio:v1";

export const AUDIO_SETTINGS_VERSION = 2;

export const AUDIO_STORAGE_KEY = "devlife:audio:v2";

export type AudioLevels = {
  music: number;
  sfx: number;
  muted: boolean;
};

function configuredVolume(value: number, fallback: number): number {
  const next = clamp01(value);
  return next > 0 ? next : fallback;
}

/** Sound is on: not muted, and both sliders are above zero. */
export const DEFAULT_AUDIO_LEVELS: AudioLevels = {
  music: configuredVolume(gameConfig.audio_music_volume, 0.5),
  sfx: configuredVolume(gameConfig.audio_sfx_volume, 0.8),
  muted: false,
};

function volumeField(value: unknown, fallback: number, zeroIsFallback: boolean): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const next = clamp01(value);
  if (zeroIsFallback && next === 0) return fallback;
  return next;
}

/**
 * v2 is the saved choice and is kept, including an explicit mute.
 * v1 is the previous generation: unmute once, and replace a zero slider
 * with the non-zero default. Anything else falls back to sound on.
 */
export function parseAudioSettings(raw: string | null, defaults: AudioLevels): AudioLevels {
  if (!raw) return { ...defaults };
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.v === AUDIO_SETTINGS_VERSION) {
      return {
        music: volumeField(data.music, defaults.music, false),
        sfx: volumeField(data.sfx, defaults.sfx, false),
        muted: typeof data.muted === "boolean" ? data.muted : false,
      };
    }
    if (data.v === 1) {
      return {
        music: volumeField(data.music, defaults.music, true),
        sfx: volumeField(data.sfx, defaults.sfx, true),
        muted: false,
      };
    }
    return { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function serializeAudioSettings(levels: AudioLevels): string {
  return JSON.stringify({
    v: AUDIO_SETTINGS_VERSION,
    music: clamp01(levels.music),
    sfx: clamp01(levels.sfx),
    muted: Boolean(levels.muted),
  });
}

export type AudioSettingsStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** Read v2. If only a v1 payload exists, unmute it once and store v2. */
export function loadAudioSettings(storage: AudioSettingsStorage): AudioLevels {
  try {
    const saved = storage.getItem(AUDIO_STORAGE_KEY);
    if (saved) return parseAudioSettings(saved, DEFAULT_AUDIO_LEVELS);
    const legacy = storage.getItem(LEGACY_AUDIO_STORAGE_KEY);
    if (!legacy) return { ...DEFAULT_AUDIO_LEVELS };
    const migrated = parseAudioSettings(legacy, DEFAULT_AUDIO_LEVELS);
    try {
      storage.setItem(AUDIO_STORAGE_KEY, serializeAudioSettings(migrated));
      storage.removeItem(LEGACY_AUDIO_STORAGE_KEY);
    } catch {
      /* private mode / quota */
    }
    return migrated;
  } catch {
    return { ...DEFAULT_AUDIO_LEVELS };
  }
}

type Listener = (levels: AudioLevels) => void;

let current: AudioLevels | null = null;
const listeners = new Set<Listener>();

function readStored(): AudioLevels {
  if (typeof window === "undefined") return { ...DEFAULT_AUDIO_LEVELS };
  try {
    return loadAudioSettings(window.localStorage);
  } catch {
    return { ...DEFAULT_AUDIO_LEVELS };
  }
}

export function getAudioSettings(): AudioLevels {
  if (!current) current = readStored();
  return current;
}

export function updateAudioSettings(patch: Partial<AudioLevels>): AudioLevels {
  const previous = getAudioSettings();
  const next: AudioLevels = {
    music: clamp01(patch.music ?? previous.music),
    sfx: clamp01(patch.sfx ?? previous.sfx),
    muted: patch.muted ?? previous.muted,
  };
  current = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, serializeAudioSettings(next));
    } catch {
      /* private mode / quota */
    }
  }
  for (const listener of listeners) listener(next);
  return next;
}

export function subscribeAudioSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
