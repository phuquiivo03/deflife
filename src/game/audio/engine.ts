import type { PhaseId } from "../time/config";
import {
  bgmIdForPhase,
  type CueKey,
  phaseCueKey,
  resolveCueKey,
  type TimeAudioPlan,
} from "./cues";
import { bgmUrl, clamp01, mixGain, parseManifest, type AudioCue } from "./manifest";
import { DEFAULT_AUDIO_LEVELS, type AudioLevels } from "./settings";
import {
  bgmLeadSeconds,
  parseSpriteMap,
  spriteFileUrl,
  spriteSlice,
  type AudioFormat,
  type SpriteMap,
} from "./sprite";

export type GainParamLike = { value: number };

export type AudioNodeLike = {
  connect(destination: AudioNodeLike): void;
  disconnect(): void;
};

export type GainNodeLike = AudioNodeLike & {
  gain: GainParamLike;
};

export type AudioBufferLike = {
  duration: number;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
};

export type BufferSourceLike = AudioNodeLike & {
  buffer: AudioBufferLike | null;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  onended: (() => void) | null;
  start(when?: number, offset?: number, duration?: number): void;
  stop(when?: number): void;
};

export type AudioContextLike = {
  state: string;
  sampleRate: number;
  currentTime: number;
  baseLatency?: number;
  destination: AudioNodeLike;
  resume(): Promise<void>;
  close(): Promise<void>;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBufferLike>;
  createBuffer(channels: number, length: number, sampleRate: number): AudioBufferLike;
  createBufferSource(): BufferSourceLike;
  createGain(): GainNodeLike;
};

export type AudioResponseLike = {
  ok: boolean;
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type AudioFetch = (input: string) => Promise<AudioResponseLike>;

export type AudioEngineOptions = {
  createContext: () => AudioContextLike | null;
  /** Chosen with canPlayType. Tests pass it directly. */
  format?: AudioFormat;
  fadeMs?: number;
  /** Test hook. Defaults to requestAnimationFrame in the browser. */
  schedule?: (callback: (now: number) => void) => void;
  /** Test hook. Defaults to requestIdleCallback, then a timeout. */
  scheduleIdle?: (work: () => void | Promise<void>) => void;
  now?: () => number;
  fetch?: AudioFetch;
  trace?: boolean;
  onLatency?: (ms: number, id: string) => void;
};

export type AudioEngine = {
  setManifest(data: unknown): void;
  setSettings(levels: AudioLevels): void;
  notePhase(phase: PhaseId): void;
  /** Fetch and decode the SFX sprite. Does not fetch BGM. */
  preloadSfx(): Promise<void>;
  /** Resume the context and play a 1-sample silent buffer. Idempotent. */
  unlock(): void;
  /**
   * `gestureAt` is `performance.now()` from the pointerdown handler.
   * When set, the engine records the time until `source.start`.
   */
  playKey(key: CueKey, gestureAt?: number): void;
  applyTimePlan(plan: TimeAudioPlan): void;
  dispose(): void;
  /** Currently looping bed, if any. */
  bedUrl(): string | null;
};

const SFX_CATEGORIES = ["ui", "economy", "time"] as const;
type SfxCategory = (typeof SFX_CATEGORIES)[number];

type LiveBed = {
  url: string;
  source: BufferSourceLike;
  fade: GainNodeLike;
};

function defaultFetch(input: string): Promise<AudioResponseLike> {
  return fetch(input);
}

export function createAudioEngine(options: AudioEngineOptions): AudioEngine {
  const fadeMs = options.fadeMs ?? 700;
  const format: AudioFormat = options.format ?? "ogg";
  const schedule =
    options.schedule ??
    ((callback: (now: number) => void) => {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(callback);
      else callback(options.now?.() ?? 0);
    });
  const scheduleIdle =
    options.scheduleIdle ??
    ((work: () => void | Promise<void>) => {
      const run = () => {
        try {
          void Promise.resolve(work()).catch(() => {});
        } catch {
          /* ignore */
        }
      };
      if (typeof requestIdleCallback === "function") requestIdleCallback(() => run());
      else setTimeout(run, 1);
    });
  const now = options.now ?? (() => (typeof performance !== "undefined" ? performance.now() : 0));
  const fetchImpl = options.fetch ?? defaultFetch;

  let ctx: AudioContextLike | null = null;
  try {
    ctx = options.createContext();
  } catch {
    ctx = null;
  }

  let master: GainNodeLike | null = null;
  let musicGain: GainNodeLike | null = null;
  const buses: Partial<Record<SfxCategory, GainNodeLike>> = {};

  if (ctx) {
    try {
      master = ctx.createGain();
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.connect(master);
      for (const name of SFX_CATEGORIES) {
        const bus = ctx.createGain();
        bus.connect(master);
        buses[name] = bus;
      }
    } catch {
      ctx = null;
      master = null;
      musicGain = null;
    }
  }

  let byId = new Map<string, AudioCue>();
  let sprite: SpriteMap | null = null;
  let sfxBuffer: AudioBufferLike | null = null;
  let settings: AudioLevels = { ...DEFAULT_AUDIO_LEVELS };
  let unlocked = false;
  let phase: PhaseId | null = null;
  let bed: LiveBed | null = null;
  let bedJob = 0;
  let loadingUrl: string | null = null;
  let fadeToken = 0;
  let queued: { key: CueKey; gestureAt?: number } | null = null;
  let spriteBytes: ArrayBuffer | null = null;
  let decoding: Promise<void> | null = null;
  const decoded = new Map<string, AudioBufferLike>();

  applyGains();

  function applyGains() {
    if (master) master.gain.value = settings.muted ? 0 : 1;
    if (musicGain) musicGain.gain.value = clamp01(settings.music);
    for (const name of SFX_CATEGORIES) {
      const bus = buses[name];
      if (bus) bus.gain.value = clamp01(settings.sfx);
    }
  }

  function indexManifest(data: unknown) {
    try {
      byId = new Map(parseManifest(data).map((cue) => [cue.id, cue]));
    } catch {
      byId = new Map();
    }
  }

  function cueForKey(key: CueKey): AudioCue | null {
    const id = resolveCueKey(byId.keys(), key);
    if (!id) return null;
    return byId.get(id) ?? null;
  }

  function busFor(cue: AudioCue): GainNodeLike | null {
    if (cue.category === "economy") return buses.economy ?? null;
    if (cue.category === "time") return buses.time ?? null;
    return buses.ui ?? null;
  }

  function reportLatency(ms: number, id: string) {
    try {
      options.onLatency?.(ms, id);
    } catch {
      /* ignore */
    }
    if (typeof window === "undefined") return;
    window.__DEVLIFE_AUDIO_LAST_MS = ms;
    if (window.__DEVLIFE_AUDIO_TRACE || options.trace) {
      console.info(`[devlife-audio] pointerdown→source.start ${ms.toFixed(2)}ms ${id}`);
    }
  }

  function playCue(cue: AudioCue, gestureAt?: number) {
    if (!cue || cue.type === "bgm" || !unlocked || !ctx || !sfxBuffer || !sprite) return;
    const slice = spriteSlice(sprite, format, cue.id);
    const bus = busFor(cue);
    if (!slice || !bus) return;
    const source = ctx.createBufferSource();
    const trim = ctx.createGain();
    trim.gain.value = cue.volume;
    source.buffer = sfxBuffer;
    source.connect(trim);
    trim.connect(bus);
    try {
      source.start(ctx.currentTime, slice.offset, slice.duration);
    } catch {
      return;
    }
    if (gestureAt != null && Number.isFinite(gestureAt)) {
      reportLatency(Math.max(0, now() - gestureAt), cue.id);
    }
    source.onended = () => {
      try {
        source.disconnect();
      } catch {
        /* ignore */
      }
      try {
        trim.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  function playResolved(key: CueKey, gestureAt?: number) {
    if (!unlocked) return;
    const specific = cueForKey(key);
    const cue =
      specific ??
      (key === "phaseMorning" || key === "phaseNoon" || key === "phaseEvening" || key === "phaseNight"
        ? cueForKey("phase")
        : null);
    if (!cue) return;
    if (!sfxBuffer) {
      queued = { key: cue === specific ? key : "phase", gestureAt };
      return;
    }
    playCue(cue, gestureAt);
  }

  function flushQueued() {
    if (!queued || !sfxBuffer || !unlocked) return;
    const pending = queued;
    queued = null;
    playResolved(pending.key, pending.gestureAt);
  }

  function decodeSprite(): Promise<void> {
    if (sfxBuffer || !spriteBytes || !ctx) return Promise.resolve();
    if (decoding) return decoding;
    const bytes = spriteBytes;
    const context = ctx;
    decoding = context
      .decodeAudioData(bytes.slice(0))
      .then((buffer) => {
        if (ctx !== context) return;
        sfxBuffer = buffer;
        spriteBytes = null;
        markReady();
        flushQueued();
      })
      .catch(() => {
        /* keep the bytes and try again after resume */
      })
      .finally(() => {
        decoding = null;
      });
    return decoding;
  }

  function stopBed(live: LiveBed) {
    try {
      live.source.stop();
    } catch {
      /* ignore */
    }
    try {
      live.source.disconnect();
    } catch {
      /* ignore */
    }
    try {
      live.fade.disconnect();
    } catch {
      /* ignore */
    }
  }

  function spinBed(cue: AudioCue, url: string, buffer: AudioBufferLike, lead: number, crossfade: boolean) {
    if (!ctx || !musicGain) return;
    const previous = bed;
    const fade = ctx.createGain();
    fade.connect(musicGain);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const safeLead = lead > 0 && lead < buffer.duration ? lead : 0;
    source.loopStart = safeLead;
    source.loopEnd = buffer.duration > 0 ? buffer.duration : 0;
    source.connect(fade);
    try {
      source.start(ctx.currentTime, safeLead);
    } catch {
      return;
    }
    bed = { url, source, fade };
    fadeToken += 1;
    const token = fadeToken;
    const target = cue.volume;
    if (!crossfade || !previous || fadeMs <= 0) {
      if (previous) stopBed(previous);
      fade.gain.value = target;
      return;
    }
    const from = previous.fade.gain.value;
    fade.gain.value = 0;
    const started = now();
    const step = (frameNow: number) => {
      if (token !== fadeToken) return;
      const t = fadeMs <= 0 ? 1 : Math.min(1, (frameNow - started) / fadeMs);
      previous.fade.gain.value = mixGain(from, 0, t);
      fade.gain.value = mixGain(0, target, t);
      if (t < 1) schedule(step);
      else stopBed(previous);
    };
    schedule(step);
  }

  function leadsReady(): boolean {
    return format === "ogg" || sprite !== null;
  }

  function requestBed() {
    if (!unlocked || !phase || !ctx || !leadsReady()) return;
    const cue = byId.get(bgmIdForPhase(phase));
    if (!cue) return;
    const url = bgmUrl(cue, format);
    if (!url || bed?.url === url || loadingUrl === url) return;
    loadingUrl = url;
    const job = ++bedJob;
    const phaseNow = phase;
    scheduleIdle(() => startBed(phaseNow, job, url));
  }

  async function startBed(phaseNow: PhaseId, job: number, url: string): Promise<void> {
    try {
      if (job !== bedJob || !ctx || !unlocked) return;
      const cue = byId.get(bgmIdForPhase(phaseNow));
      if (!cue) return;
      if (bed?.url === url) return;
      let buffer = decoded.get(url);
      if (!buffer) {
        const response = await fetchImpl(url);
        if (!response.ok || job !== bedJob) return;
        const bytes = await response.arrayBuffer();
        if (job !== bedJob || !ctx) return;
        buffer = await ctx.decodeAudioData(bytes.slice(0));
        decoded.set(url, buffer);
      }
      if (job !== bedJob || !unlocked || !buffer) return;
      const lead = bgmLeadSeconds(sprite, format, cue.id);
      spinBed(cue, url, buffer, lead, bed !== null && bed.url !== url);
    } catch {
      /* ignore */
    } finally {
      if (loadingUrl === url) loadingUrl = null;
    }
  }

  async function readJson(url: string): Promise<unknown | null> {
    const response = await fetchImpl(url);
    if (!response.ok) return null;
    return response.json();
  }

  function markReady() {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.sfxReady = "1";
  }

  return {
    setManifest(data: unknown) {
      indexManifest(data);
      if (unlocked) requestBed();
    },
    setSettings(levels: AudioLevels) {
      settings = {
        music: levels.music,
        sfx: levels.sfx,
        muted: levels.muted,
      };
      applyGains();
    },
    notePhase(next: PhaseId) {
      phase = next;
    },
    async preloadSfx() {
      try {
        const [manifestData, offsetsData] = await Promise.all([
          readJson("/audio/manifest.json"),
          readJson("/audio/sprite/offsets.json"),
        ]);
        if (manifestData) indexManifest(manifestData);
        if (offsetsData) sprite = parseSpriteMap(offsetsData);
        if (unlocked) requestBed();
        if (!sprite || !ctx) return;
        const url = spriteFileUrl(sprite, format);
        if (!url) return;
        const response = await fetchImpl(url);
        if (!response.ok) return;
        const bytes = await response.arrayBuffer();
        if (!ctx) return;
        spriteBytes = bytes.slice(0);
        await decodeSprite();
      } catch {
        /* audio must not surface */
      }
    },
    unlock() {
      if (unlocked) return;
      unlocked = true;
      if (!ctx) return;
      try {
        void ctx.resume().catch(() => {});
      } catch {
        /* ignore */
      }
      try {
        const silence = ctx.createBuffer(1, 1, ctx.sampleRate || 32000);
        const source = ctx.createBufferSource();
        source.buffer = silence;
        source.connect(ctx.destination);
        source.start(ctx.currentTime);
      } catch {
        /* ignore */
      }
      if (typeof window !== "undefined" && window.__DEVLIFE_AUDIO_TRACE && ctx.baseLatency != null) {
        window.__DEVLIFE_AUDIO_BASE_LATENCY = ctx.baseLatency;
      }
      requestBed();
      if (!sfxBuffer && spriteBytes) {
        try {
          void decodeSprite();
        } catch {
          /* ignore */
        }
      } else {
        try {
          flushQueued();
        } catch {
          /* ignore */
        }
      }
    },
    playKey(key: CueKey, gestureAt?: number) {
      try {
        playResolved(key, gestureAt);
      } catch {
        /* ignore */
      }
    },
    applyTimePlan(plan: TimeAudioPlan) {
      try {
        if (plan.bgmPhase) {
          phase = plan.bgmPhase;
          if (unlocked) requestBed();
        }
        if (!unlocked) return;
        for (const chime of plan.phaseChimes) playResolved(phaseCueKey(chime));
        if (plan.timeSkip) playResolved("timeSkip");
        if (plan.dayStarted) playResolved("dayStarted");
        if (plan.sleep) playResolved("sleep");
      } catch {
        /* ignore */
      }
    },
    dispose() {
      fadeToken += 1;
      bedJob += 1;
      unlocked = false;
      loadingUrl = null;
      if (bed) stopBed(bed);
      bed = null;
      const closing = ctx;
      ctx = null;
      try {
        void closing?.close().catch(() => {});
      } catch {
        /* ignore */
      }
    },
    bedUrl() {
      return bed?.url ?? null;
    },
  };
}
