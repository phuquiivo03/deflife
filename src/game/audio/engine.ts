import type { PhaseId } from "../time/config";
import {
  bgmBedForPhase,
  bgmIdForPhase,
  type CueKey,
  phaseCueKey,
  resolveCueKey,
  type TimeAudioPlan,
} from "./cues";
import {
  busGain,
  cueUrls,
  mixGain,
  parseManifest,
  type AudioCue,
} from "./manifest";
import type { AudioLevels } from "./settings";

export type AudioSink = {
  src: string;
  loop: boolean;
  volume: number;
  paused: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: "error", listener: () => void): void;
};

export type AudioEngineOptions = {
  createSink: () => AudioSink | null;
  fadeMs?: number;
  /** Test hook. Defaults to requestAnimationFrame in the browser. */
  schedule?: (callback: (now: number) => void) => void;
  now?: () => number;
};

export type AudioEngine = {
  setManifest(data: unknown): void;
  setSettings(levels: AudioLevels): void;
  notePhase(phase: PhaseId): void;
  unlock(): void;
  playKey(key: CueKey): void;
  applyTimePlan(plan: TimeAudioPlan): void;
  dispose(): void;
  /** Currently looping bed, if any. */
  bedUrl(): string | null;
};

function setVolume(sink: AudioSink, value: number): void {
  try {
    const next = value < 0 ? 0 : value > 1 ? 1 : value;
    sink.volume = next;
  } catch {
    /* ignore */
  }
}

function safePlay(sink: AudioSink): void {
  try {
    void Promise.resolve(sink.play()).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function createAudioEngine(options: AudioEngineOptions): AudioEngine {
  const fadeMs = options.fadeMs ?? 700;
  const schedule =
    options.schedule ??
    ((callback: (now: number) => void) => {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(callback);
      else callback(options.now?.() ?? 0);
    });
  const now = options.now ?? (() => (typeof performance !== "undefined" ? performance.now() : 0));

  let byId = new Map<string, AudioCue>();
  let settings: AudioLevels = { music: 0.5, sfx: 0.8, muted: false };
  let unlocked = false;
  let phase: PhaseId | null = null;
  let bedSink: AudioSink | null = null;
  let bedUrlValue: string | null = null;
  let bedCue: AudioCue | null = null;
  let fadeToken = 0;

  function indexManifest(next: AudioCue[]) {
    byId = new Map(next.map((cue) => [cue.id, cue]));
  }

  function cueForKey(key: CueKey): AudioCue | null {
    const id = resolveCueKey(byId.keys(), key);
    if (!id) return null;
    return byId.get(id) ?? null;
  }

  function spawn(): AudioSink | null {
    try {
      return options.createSink();
    } catch {
      return null;
    }
  }

  function playCue(cue: AudioCue | null): void {
    if (!cue || !unlocked) return;
    if (cue.type === "bgm") return;
    const urls = cueUrls(cue);
    if (urls.length === 0) return;
    const sink = spawn();
    if (!sink) return;
    let index = 0;
    const start = () => {
      const url = urls[index];
      if (!url) return;
      try {
        sink.loop = cue.loop;
        sink.src = url;
        setVolume(sink, busGain(settings.sfx, cue.volume, settings.muted));
        safePlay(sink);
      } catch {
        /* ignore */
      }
    };
    try {
      sink.addEventListener("error", () => {
        index += 1;
        if (index < urls.length) start();
      });
    } catch {
      /* ignore */
    }
    start();
  }

  function startBed(nextPhase: PhaseId, crossfade: boolean): void {
    const cue = byId.get(bgmIdForPhase(nextPhase)) ?? null;
    if (!cue) return;
    const urls = cueUrls({ ...cue, type: "bgm" });
    const url = urls[0];
    if (!url) return;
    if (bedUrlValue === url && bedSink && !bedSink.paused) return;

    const next = spawn();
    if (!next) return;
    const previous = bedSink;
    const target = () => busGain(settings.music, cue.volume, settings.muted);
    try {
      next.loop = true;
      next.src = url;
    } catch {
      return;
    }
    bedSink = next;
    bedUrlValue = url;
    bedCue = cue;
    fadeToken += 1;
    const token = fadeToken;

    if (!crossfade || !previous || fadeMs <= 0) {
      if (previous) {
        setVolume(previous, 0);
        try {
          previous.pause();
        } catch {
          /* ignore */
        }
      }
      setVolume(next, target());
      safePlay(next);
      return;
    }

    const from = previous.volume;
    setVolume(next, 0);
    safePlay(next);
    const started = now();
    const step = (frameNow: number) => {
      if (token !== fadeToken) return;
      const t = fadeMs <= 0 ? 1 : Math.min(1, (frameNow - started) / fadeMs);
      setVolume(previous, mixGain(from, 0, t));
      setVolume(next, mixGain(0, target(), t));
      if (t < 1) schedule(step);
      else {
        try {
          previous.pause();
        } catch {
          /* ignore */
        }
      }
    };
    schedule(step);
  }

  return {
    setManifest(data: unknown) {
      try {
        indexManifest(parseManifest(data));
      } catch {
        indexManifest([]);
      }
      if (unlocked && phase && !bedSink) startBed(phase, false);
    },
    setSettings(levels: AudioLevels) {
      settings = levels;
      fadeToken += 1;
      if (bedSink && bedCue) {
        setVolume(bedSink, busGain(settings.music, bedCue.volume, settings.muted));
      }
    },
    notePhase(next: PhaseId) {
      phase = next;
    },
    unlock() {
      if (unlocked) return;
      unlocked = true;
      if (phase) startBed(phase, false);
    },
    playKey(key: CueKey) {
      try {
        const specific = cueForKey(key);
        if (specific) {
          playCue(specific);
          return;
        }
        if (
          key === "phaseMorning" ||
          key === "phaseNoon" ||
          key === "phaseEvening" ||
          key === "phaseNight"
        ) {
          playCue(cueForKey("phase"));
        }
      } catch {
        /* ignore */
      }
    },
    applyTimePlan(plan: TimeAudioPlan) {
      try {
        if (plan.bgmPhase) {
          const previous = phase;
          phase = plan.bgmPhase;
          if (unlocked) {
            const crossfade =
              previous !== null &&
              bgmBedForPhase(previous) !== bgmBedForPhase(plan.bgmPhase) &&
              bedSink !== null;
            startBed(plan.bgmPhase, crossfade);
          }
        }
        if (!unlocked) return;
        for (const chime of plan.phaseChimes) {
          const key = phaseCueKey(chime);
          const specific = cueForKey(key);
          playCue(specific ?? cueForKey("phase"));
        }
        if (plan.timeSkip) playCue(cueForKey("timeSkip"));
        if (plan.dayStarted) playCue(cueForKey("dayStarted"));
        if (plan.sleep) playCue(cueForKey("sleep"));
      } catch {
        /* ignore */
      }
    },
    dispose() {
      fadeToken += 1;
      unlocked = false;
      try {
        bedSink?.pause();
      } catch {
        /* ignore */
      }
      bedSink = null;
      bedUrlValue = null;
      bedCue = null;
    },
    bedUrl() {
      return bedUrlValue;
    },
  };
}
