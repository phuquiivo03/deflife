import type { AudioContextLike } from "./engine";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    __DEVLIFE_AUDIO_TRACE?: boolean;
    __DEVLIFE_AUDIO_LAST_MS?: number;
    __DEVLIFE_AUDIO_BASE_LATENCY?: number;
  }
}

/** One shared context. `interactive` asks the browser for the smallest output buffer. */
export function createBrowserAudioContext(): AudioContextLike | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    return new Ctx({ latencyHint: "interactive" }) as unknown as AudioContextLike;
  } catch {
    return null;
  }
}
