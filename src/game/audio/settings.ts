import gameConfig from "../../../config/game_config.json";
import { clamp01 } from "./manifest";

export const AUDIO_STORAGE_KEY = "devlife:audio:v1";

export type AudioLevels = {
  music: number;
  sfx: number;
  muted: boolean;
};

export const DEFAULT_AUDIO_LEVELS: AudioLevels = {
  music: clamp01(gameConfig.audio_music_volume),
  sfx: clamp01(gameConfig.audio_sfx_volume),
  muted: false,
};

export function parseAudioSettings(raw: string | null, defaults: AudioLevels): AudioLevels {
  if (!raw) return { ...defaults };
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.v !== 1) return { ...defaults };
    return {
      music: typeof data.music === "number" ? clamp01(data.music) : defaults.music,
      sfx: typeof data.sfx === "number" ? clamp01(data.sfx) : defaults.sfx,
      muted: typeof data.muted === "boolean" ? data.muted : defaults.muted,
    };
  } catch {
    return { ...defaults };
  }
}

export function serializeAudioSettings(levels: AudioLevels): string {
  return JSON.stringify({
    v: 1,
    music: clamp01(levels.music),
    sfx: clamp01(levels.sfx),
    muted: Boolean(levels.muted),
  });
}

type Listener = (levels: AudioLevels) => void;

let current: AudioLevels | null = null;
const listeners = new Set<Listener>();

function readStored(): AudioLevels {
  if (typeof window === "undefined") return { ...DEFAULT_AUDIO_LEVELS };
  try {
    return parseAudioSettings(window.localStorage.getItem(AUDIO_STORAGE_KEY), DEFAULT_AUDIO_LEVELS);
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
