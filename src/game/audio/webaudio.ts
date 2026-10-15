import type { AudioBufferLike, AudioContextLike } from "./engine";

type InlineAudio = HTMLAudioElement & { playsInline?: boolean };

function markPlaysInline(el: HTMLAudioElement): void {
  const inline = el as InlineAudio;
  inline.playsInline = true;
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
}

/** One short silent WAV. Looping it is inaudible and holds the media route open. */
export const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    __DEVLIFE_AUDIO_TRACE?: boolean;
    __DEVLIFE_AUDIO_LAST_MS?: number;
    __DEVLIFE_AUDIO_BASE_LATENCY?: number;
  }
  interface Navigator {
    audioSession?: { type: string };
  }
}

export type DecodeHost = {
  decodeAudioData(
    data: ArrayBuffer,
    success?: (buffer: AudioBufferLike) => void,
    failure?: (error: Error) => void,
  ): Promise<AudioBufferLike> | undefined;
};

const logged = new Set<string>();

/** Each distinct failure is printed once so a retry loop cannot flood the console. */
export function logAudioOnce(message: string): void {
  if (logged.has(message)) return;
  logged.add(message);
  console.warn(`[devlife-audio] ${message}`);
}

/** Tests clear the once-only set between cases. */
export function resetLoggedAudio(): void {
  logged.clear();
}

/**
 * Older iOS returns void and delivers the buffer through callbacks.
 * Newer browsers return a Promise and may also call the callbacks.
 */
export function decodeAudioBuffer(ctx: DecodeHost, data: ArrayBuffer): Promise<AudioBufferLike> {
  const copy = data.slice(0);
  return new Promise((resolve, reject) => {
    let settled = false;
    const ok = (buffer: AudioBufferLike) => {
      if (settled || !buffer) return;
      settled = true;
      resolve(buffer);
    };
    const fail = (error?: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error("decodeAudioData failed"));
    };
    // "unknown" while decodeAudioData is on the stack. A sync callback is held
    // until we know whether the promise form exists. Some WebKit builds call the
    // error callback with null and still return a promise that succeeds.
    let mode: "unknown" | "promise" | "callback" = "unknown";
    const early: { buffer?: AudioBufferLike; error?: unknown } = {};
    let sawEarly = false;
    try {
      const result = ctx.decodeAudioData(
        copy,
        (buffer) => {
          if (mode === "promise") return;
          if (mode === "unknown") {
            sawEarly = true;
            early.buffer = buffer;
            return;
          }
          ok(buffer);
        },
        (error) => {
          if (mode === "promise") return;
          if (mode === "unknown") {
            sawEarly = true;
            early.error = error;
            return;
          }
          fail(error);
        },
      );
      if (result && typeof result.then === "function") {
        mode = "promise";
        void result.then(ok, fail);
        return;
      }
      mode = "callback";
      if (early.buffer) ok(early.buffer);
      else if (sawEarly) fail(early.error);
    } catch (error) {
      fail(error);
    }
  });
}

/** iOS 16.4+ routes Web Audio with `<audio>` when the session type is playback. */
export function enablePlaybackSession(
  nav: { audioSession?: { type: string } } | null | undefined,
): boolean {
  const session = nav?.audioSession;
  if (!session) return false;
  try {
    session.type = "playback";
    return session.type === "playback";
  } catch {
    return false;
  }
}

type ContextCtor = new (options?: { latencyHint?: string }) => AudioContextLike;

/** `latencyHint` throws on older WebKit. A no-arg constructor is the fallback. */
export function createAudioContextFrom(Ctor: ContextCtor | undefined): AudioContextLike | null {
  if (!Ctor) return null;
  try {
    return new Ctor({ latencyHint: "interactive" });
  } catch {
    try {
      return new Ctor();
    } catch {
      return null;
    }
  }
}

/** One shared context. Prefers `AudioContext`, then `webkitAudioContext`. */
export function createBrowserAudioContext(): AudioContextLike | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
  return createAudioContextFrom(Ctx as ContextCtor | undefined);
}

export type KeepAlive = {
  play(): void;
  stop(): void;
};

/**
 * Silent looping `<audio playsinline>`. iOS plays this on the media channel,
 * and Web Audio started in the same gesture follows it past the ring switch.
 */
export function createSilentKeepAlive(): KeepAlive | null {
  if (typeof document === "undefined") return null;
  try {
    const el = document.createElement("audio");
    el.src = SILENT_WAV_DATA_URI;
    el.loop = true;
    el.preload = "auto";
    markPlaysInline(el);
    el.setAttribute("aria-hidden", "true");
    el.dataset.audioKeepalive = "1";
    el.style.cssText = "position:fixed;width:0;height:0;opacity:0;pointer-events:none";
    document.body.appendChild(el);
    return {
      play() {
        try {
          void el.play().catch(() => {});
        } catch {
          /* ignore */
        }
      },
      stop() {
        try {
          el.pause();
        } catch {
          /* ignore */
        }
        try {
          el.remove();
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return null;
  }
}

/** Per-file SFX or BGM when the sprite or a bed buffer cannot be decoded. */
export function createFileAudioElement(): HTMLAudioElement | null {
  if (typeof document === "undefined") return null;
  try {
    const el = document.createElement("audio");
    el.preload = "auto";
    markPlaysInline(el);
    return el;
  } catch {
    return null;
  }
}
