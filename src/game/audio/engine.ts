import type { PhaseId } from "../time/config";
import {
  bgmIdForPhase,
  type CueKey,
  phaseCueKey,
  resolveCueKey,
  type TimeAudioPlan,
} from "./cues";
import { bgmUrl, busGain, clamp01, cueUrls, mixGain, parseManifest, type AudioCue } from "./manifest";
import { DEFAULT_AUDIO_LEVELS, type AudioLevels } from "./settings";
import {
  bgmLeadSeconds,
  parseSpriteMap,
  spriteFileUrl,
  spriteSlice,
  type AudioFormat,
  type SpriteMap,
} from "./sprite";
import {
  createFileAudioElement,
  createSilentKeepAlive,
  decodeAudioBuffer,
  enablePlaybackSession,
  logAudioOnce,
  type KeepAlive,
} from "./webaudio";

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
  resume(): Promise<void> | void;
  close(): Promise<void>;
  onstatechange?: (() => void) | null;
  decodeAudioData(
    data: ArrayBuffer,
    success?: (buffer: AudioBufferLike) => void,
    failure?: (error: Error) => void,
  ): Promise<AudioBufferLike> | undefined;
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

export type SfxElementLike = {
  src: string;
  loop: boolean;
  volume: number;
  preload: string;
  playsInline: boolean;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: "error" | "loadedmetadata" | "playing" | "seeked", listener: () => void): void;
};

export type KeepAliveHandle = KeepAlive;

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
  /** Test hook. Defaults to the callback-compatible Web Audio decoder. */
  decodeAudioData?: (ctx: AudioContextLike, data: ArrayBuffer) => Promise<AudioBufferLike>;
  /** Test hook. Defaults to `navigator.audioSession.type = "playback"`. */
  enableSession?: () => boolean;
  /** Test hook. Silent looping `<audio>` used when audioSession is missing. */
  createKeepAlive?: () => KeepAlive | null;
  /** Test hook. Per-file SFX element used after the sprite cannot be decoded. */
  createSfxElement?: () => SfxElementLike | null;
};

export type AudioEngine = {
  setManifest(data: unknown): void;
  setSettings(levels: AudioLevels): void;
  notePhase(phase: PhaseId): void;
  /** Fetch and decode the SFX sprite. Does not fetch BGM. */
  preloadSfx(): Promise<void>;
  /**
   * Resume inside the gesture, then play a 1-sample silent buffer.
   * Later calls resume again when iOS has interrupted or suspended the context.
   */
  unlock(): void;
  /** Resume after the page becomes visible, including the `interrupted` state. */
  resume(): void;
  /**
   * `gestureAt` is `performance.now()` from the pointerdown handler.
   * When set, the engine records the time until `source.start`.
   */
  playKey(key: CueKey, gestureAt?: number): void;
  /**
   * Loop one SFX through the SFX bus until `stopLoop`.
   * A missing manifest id or sprite slice stops any current loop and stays silent.
   * The same id already looping is left running.
   */
  startLoop(key: CueKey): void;
  stopLoop(): void;
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

type LiveLoop = {
  id: string;
  volume: number;
  source: BufferSourceLike | null;
  trim: GainNodeLike | null;
  element: SfxElementLike | null;
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

  let playbackFormat: AudioFormat = format;
  let sessionOn = false;
  const enableSession =
    options.enableSession ??
    (() => {
      try {
        return enablePlaybackSession(typeof navigator === "undefined" ? null : navigator);
      } catch {
        return false;
      }
    });
  try {
    sessionOn = enableSession();
  } catch {
    sessionOn = false;
  }
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
  let sfxRoute: "sprite" | "element" = "sprite";
  let settings: AudioLevels = { ...DEFAULT_AUDIO_LEVELS };
  let unlocked = false;
  let phase: PhaseId | null = null;
  let bed: LiveBed | null = null;
  let bedElement: SfxElementLike | null = null;
  let bedCue: AudioCue | null = null;
  let bedUrlValue: string | null = null;
  let bedJob = 0;
  let loadingUrl: string | null = null;
  let fadeToken = 0;
  let queued: { key: CueKey; gestureAt?: number } | null = null;
  let pendingLoop: CueKey | null = null;
  let liveLoop: LiveLoop | null = null;
  let keepAlive: KeepAlive | null = null;
  let resuming = false;
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
    if (!cue || cue.type === "bgm" || !unlocked) return;
    if (sfxRoute === "element" || !ctx || !sfxBuffer || !sprite) {
      if (sfxRoute === "element") playElement(cue, gestureAt);
      return;
    }
    const slice = spriteSlice(sprite, playbackFormat, cue.id);
    const bus = busFor(cue);
    if (!slice || !bus || !ctx) return;
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
    if (sfxRoute !== "element" && !sfxBuffer) {
      queued = { key: cue === specific ? key : "phase", gestureAt };
      return;
    }
    playCue(cue, gestureAt);
  }

  function flushQueued() {
    if (queued && unlocked && (sfxRoute === "element" || sfxBuffer)) {
      const pending = queued;
      queued = null;
      playResolved(pending.key, pending.gestureAt);
    }
    if (pendingLoop && unlocked && (sfxRoute === "element" || (sfxBuffer && sprite && ctx))) {
      const key = pendingLoop;
      pendingLoop = null;
      startLoopCue(key);
    }
  }

  function stopLiveLoop() {
    const live = liveLoop;
    liveLoop = null;
    if (!live) return;
    try {
      live.source?.stop();
    } catch {
      /* ignore */
    }
    try {
      live.source?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      live.trim?.disconnect();
    } catch {
      /* ignore */
    }
    if (live.element) {
      try {
        live.element.pause();
        live.element.loop = false;
      } catch {
        /* ignore */
      }
    }
  }

  function beginLoopElement(cue: AudioCue) {
    const urls = cueUrls(cue);
    if (!urls.length) return;
    const el = (options.createSfxElement ?? createFileAudioElement)() as SfxElementLike | null;
    if (!el) return;
    el.src = urls[0] ?? "";
    el.loop = true;
    el.preload = "auto";
    el.playsInline = true;
    el.volume = busGain(settings.sfx, cue.volume, settings.muted);
    liveLoop = { id: cue.id, volume: cue.volume, source: null, trim: null, element: el };
    try {
      const played = el.play();
      if (played && typeof played.catch === "function") void played.catch(() => {});
    } catch {
      /* ignore */
    }
  }

  function beginLoop(cue: AudioCue) {
    stopLiveLoop();
    if (sfxRoute === "element" || !ctx || !sfxBuffer || !sprite) {
      if (sfxRoute === "element") beginLoopElement(cue);
      return;
    }
    const slice = spriteSlice(sprite, playbackFormat, cue.id);
    const bus = busFor(cue);
    if (!slice || !bus) return;
    const source = ctx.createBufferSource();
    const trim = ctx.createGain();
    trim.gain.value = cue.volume;
    source.buffer = sfxBuffer;
    source.loop = true;
    source.loopStart = slice.offset;
    source.loopEnd = slice.offset + slice.duration;
    source.connect(trim);
    trim.connect(bus);
    try {
      source.start(ctx.currentTime, slice.offset);
    } catch {
      return;
    }
    liveLoop = { id: cue.id, volume: cue.volume, source, trim, element: null };
  }

  function startLoopCue(key: CueKey) {
    const cue = cueForKey(key);
    if (!cue || cue.type === "bgm") {
      pendingLoop = null;
      stopLiveLoop();
      return;
    }
    if (liveLoop?.id === cue.id) {
      pendingLoop = null;
      return;
    }
    const spriteReady = sfxRoute === "element" || Boolean(sfxBuffer && sprite && ctx);
    if (!unlocked || !spriteReady) {
      pendingLoop = key;
      stopLiveLoop();
      return;
    }
    pendingLoop = null;
    beginLoop(cue);
  }

  function stopLoopCue() {
    pendingLoop = null;
    stopLiveLoop();
  }

  function playElement(cue: AudioCue, gestureAt?: number) {
    const urls = cueUrls(cue);
    if (!urls.length) return;
    const el = (options.createSfxElement ?? createFileAudioElement)() as SfxElementLike | null;
    if (!el) return;
    let index = 0;
    const arm = () => {
      const url = urls[index];
      if (!url) return false;
      el.src = url;
      el.loop = false;
      el.preload = "auto";
      el.playsInline = true;
      el.volume = busGain(settings.sfx, cue.volume, settings.muted);
      return true;
    };
    el.addEventListener("error", () => {
      index += 1;
      if (!arm()) return;
      try {
        const played = el.play();
        if (played && typeof played.catch === "function") void played.catch(() => {});
      } catch {
        /* ignore */
      }
    });
    if (!arm()) return;
    try {
      const played = el.play();
      if (gestureAt != null && Number.isFinite(gestureAt)) {
        reportLatency(Math.max(0, now() - gestureAt), cue.id);
      }
      if (played && typeof played.catch === "function") void played.catch(() => {});
    } catch {
      /* ignore */
    }
  }

  function resumeNow() {
    if (!ctx || ctx.state === "running" || ctx.state === "closed" || resuming) return;
    resuming = true;
    try {
      const result = ctx.resume();
      if (result && typeof result.catch === "function") void result.catch(() => {});
    } catch {
      /* ignore */
    } finally {
      resuming = false;
    }
  }

  if (ctx) {
    try {
      ctx.onstatechange = () => {
        if (ctx?.state === "interrupted") resumeNow();
      };
    } catch {
      /* ignore */
    }
  }

  function playOneSample() {
    if (!ctx) return;
    try {
      const silence = ctx.createBuffer(1, 1, ctx.sampleRate || 32000);
      const source = ctx.createBufferSource();
      source.buffer = silence;
      source.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch {
      /* ignore */
    }
  }

  function ensureMediaChannel() {
    if (!sessionOn) {
      try {
        sessionOn = enableSession();
      } catch {
        sessionOn = false;
      }
    }
    if (sessionOn) return;
    if (!keepAlive) {
      try {
        keepAlive = (options.createKeepAlive ?? createSilentKeepAlive)();
      } catch {
        keepAlive = null;
      }
    }
    try {
      keepAlive?.play();
    } catch {
      /* ignore */
    }
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
    bedUrlValue = url;
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

  function stopBedElement() {
    if (!bedElement) return;
    try {
      bedElement.pause();
    } catch {
      /* ignore */
    }
    bedElement = null;
    bedCue = null;
  }

  function placeLead(el: SfxElementLike, lead: number) {
    if (lead <= 0) return;
    let placed = false;
    const jump = () => {
      if (placed) return;
      try {
        if (el.currentTime < lead) el.currentTime = lead;
        placed = el.currentTime + 0.0001 >= lead;
      } catch {
        /* ignore */
      }
    };
    el.addEventListener("loadedmetadata", jump);
    el.addEventListener("playing", jump);
    el.addEventListener("seeked", jump);
  }

  function startBedElement(cue: AudioCue, url: string) {
    if (bed?.url === url || bedUrlValue === url) return;
    stopBedElement();
    if (bed) {
      stopBed(bed);
      bed = null;
    }
    const el = (options.createSfxElement ?? createFileAudioElement)() as SfxElementLike | null;
    if (!el) return;
    el.src = url;
    el.loop = true;
    el.preload = "auto";
    el.playsInline = true;
    el.volume = busGain(settings.music, cue.volume, settings.muted);
    placeLead(el, bgmLeadSeconds(sprite, playbackFormat, cue.id));
    bedElement = el;
    bedCue = cue;
    bedUrlValue = url;
    try {
      const played = el.play();
      if (played && typeof played.catch === "function") void played.catch(() => {});
    } catch {
      /* ignore */
    }
  }

  function requestBed() {
    if (!unlocked || !phase) return;
    if (playbackFormat === "mp3" && !sprite && sfxRoute !== "element") return;
    const cue = byId.get(bgmIdForPhase(phase));
    if (!cue) return;
    const url = bgmUrl(cue, playbackFormat);
    if (!url || bed?.url === url || bedUrlValue === url || loadingUrl === url) return;
    loadingUrl = url;
    const job = ++bedJob;
    const phaseNow = phase;
    scheduleIdle(() => startBed(phaseNow, job, url));
  }

  async function startBed(phaseNow: PhaseId, job: number, url: string): Promise<void> {
    try {
      if (job !== bedJob || !unlocked) return;
      const cue = byId.get(bgmIdForPhase(phaseNow));
      if (!cue || bed?.url === url || bedUrlValue === url) return;
      if (!ctx) {
        startBedElement(cue, url);
        return;
      }
      let buffer = decoded.get(url);
      if (!buffer) {
        const response = await fetchImpl(url);
        if (!response.ok || job !== bedJob) return;
        const bytes = await response.arrayBuffer();
        if (job !== bedJob || !unlocked) return;
        const decode = options.decodeAudioData ?? decodeAudioBuffer;
        try {
          buffer = ctx ? await decode(ctx, bytes) : undefined;
        } catch (error) {
          const detail = error instanceof Error ? error.message : "decode failed";
          logAudioOnce(`BGM decode failed; using an audio element: ${detail}`);
          if (job !== bedJob) return;
          startBedElement(cue, url);
          return;
        }
        if (buffer) decoded.set(url, buffer);
      }
      if (job !== bedJob || !unlocked || !buffer || !ctx) return;
      const lead = bgmLeadSeconds(sprite, playbackFormat, cue.id);
      spinBed(cue, url, buffer, lead, bed !== null && bed.url !== url);
    } catch {
      /* ignore */
    } finally {
      if (loadingUrl === url) loadingUrl = null;
    }
  }

  async function loadSprite(fmt: AudioFormat): Promise<boolean> {
    if (!sprite || !ctx) return false;
    const url = spriteFileUrl(sprite, fmt);
    if (!url) return false;
    try {
      const response = await fetchImpl(url);
      if (!response.ok) {
        logAudioOnce(`SFX sprite failed (${fmt}): HTTP error`);
        return false;
      }
      const bytes = await response.arrayBuffer();
      if (!ctx) return false;
      const decode = options.decodeAudioData ?? decodeAudioBuffer;
      const buffer = await decode(ctx, bytes);
      if (!ctx) return false;
      sfxBuffer = buffer;
      if (fmt !== playbackFormat) {
        playbackFormat = fmt;
        loadingUrl = null;
        bedJob += 1;
        if (bed) stopBed(bed);
        bed = null;
        stopBedElement();
        bedUrlValue = null;
      }
      markReady();
      flushQueued();
      if (unlocked) requestBed();
      return true;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "decode failed";
      logAudioOnce(`SFX sprite failed (${fmt}): ${detail}`);
      return false;
    }
  }

  function fallBackToElements(reason: string) {
    if (sfxRoute === "element") return;
    sfxRoute = "element";
    logAudioOnce(reason);
    markReady();
    flushQueued();
    if (unlocked) requestBed();
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
      if (bedElement && bedCue) {
        bedElement.volume = busGain(settings.music, bedCue.volume, settings.muted);
      }
      if (liveLoop?.element) {
        liveLoop.element.volume = busGain(settings.sfx, liveLoop.volume, settings.muted);
      }
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
        if (!ctx) {
          fallBackToElements("No Web Audio context; using per-file SFX");
          return;
        }
        if (!sprite) {
          fallBackToElements("SFX sprite missing; using per-file SFX");
          return;
        }
        let ok = await loadSprite(playbackFormat);
        if (!ok && playbackFormat !== "mp3") ok = await loadSprite("mp3");
        if (!ok) fallBackToElements("SFX sprite decode failed; using per-file audio");
      } catch {
        fallBackToElements("SFX sprite decode failed; using per-file audio");
      }
    },
    unlock() {
      const wasRunning = ctx?.state === "running";
      resumeNow();
      ensureMediaChannel();
      if (ctx && !wasRunning) playOneSample();
      if (typeof window !== "undefined" && window.__DEVLIFE_AUDIO_TRACE && ctx?.baseLatency != null) {
        window.__DEVLIFE_AUDIO_BASE_LATENCY = ctx.baseLatency;
      }
      if (unlocked) return;
      unlocked = true;
      if (!ctx) fallBackToElements("No Web Audio context; using per-file SFX");
      requestBed();
      try {
        flushQueued();
      } catch {
        /* ignore */
      }
    },
    resume() {
      resumeNow();
      if (keepAlive) {
        try {
          keepAlive.play();
        } catch {
          /* ignore */
        }
        return;
      }
      if (!sessionOn) ensureMediaChannel();
    },
    playKey(key: CueKey, gestureAt?: number) {
      try {
        playResolved(key, gestureAt);
      } catch {
        /* ignore */
      }
    },
    startLoop(key: CueKey) {
      try {
        startLoopCue(key);
      } catch {
        /* ignore */
      }
    },
    stopLoop() {
      try {
        stopLoopCue();
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
      stopLoopCue();
      loadingUrl = null;
      if (bed) stopBed(bed);
      bed = null;
      stopBedElement();
      bedUrlValue = null;
      try {
        keepAlive?.stop();
      } catch {
        /* ignore */
      }
      keepAlive = null;
      const closing = ctx;
      ctx = null;
      if (closing) {
        try {
          closing.onstatechange = null;
        } catch {
          /* ignore */
        }
      }
      try {
        void closing?.close().catch(() => {});
      } catch {
        /* ignore */
      }
    },
    bedUrl() {
      return bedUrlValue ?? bed?.url ?? null;
    },
  };
}
