import type { CueKey } from "./cues";
import type { AudioEngine } from "./engine";

let current: AudioEngine | null = null;

export function attachAudioEngine(engine: AudioEngine | null): void {
  current = engine;
}

export function playCueKey(key: CueKey): void {
  try {
    current?.playKey(key);
  } catch {
    /* audio must not surface */
  }
}

export function startLoopKey(key: CueKey): void {
  try {
    current?.startLoop(key);
  } catch {
    /* audio must not surface */
  }
}

export function stopLoopKey(): void {
  try {
    current?.stopLoop();
  } catch {
    /* audio must not surface */
  }
}
