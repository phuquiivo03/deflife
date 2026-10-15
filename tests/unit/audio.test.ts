import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SIM_CATALOG } from "../../src/game/career/content";
import { resolveShippedIcon } from "../../src/lib/pixel-assets";
import {
  bgmBedForPhase,
  bgmIdForPhase,
  cueForHit,
  cueKeysForGameEvent,
  planTimeAudio,
  resolveCueKey,
  shouldCrossfadeBgm,
  type CueKey,
} from "../../src/game/audio/cues";
import { createAudioEngine, type AudioBufferLike, type AudioContextLike, type AudioNodeLike, type BufferSourceLike, type GainNodeLike } from "../../src/game/audio/engine";
import {
  bgmUrl,
  busGain,
  cueUrls,
  parseManifest,
  type AudioCue,
} from "../../src/game/audio/manifest";
import {
  bgmLeadSeconds,
  parseSpriteMap,
  preferredAudioFormat,
  type SpriteMap,
} from "../../src/game/audio/sprite";
import {
  AUDIO_STORAGE_KEY,
  DEFAULT_AUDIO_LEVELS,
  parseAudioSettings,
  serializeAudioSettings,
} from "../../src/game/audio/settings";
import type { PhaseId } from "../../src/game/time/config";
import type { TimeEvent } from "../../src/game/time/types";

class FakeNode implements AudioNodeLike {
  dest: AudioNodeLike | null = null;
  connect(dest: AudioNodeLike): void {
    this.dest = dest;
  }
  disconnect(): void {
    this.dest = null;
  }
}

class FakeGain extends FakeNode implements GainNodeLike {
  gain = { value: 1 };
}

class FakeSource extends FakeNode implements BufferSourceLike {
  buffer: AudioBufferLike | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  onended: (() => void) | null = null;
  started: { when: number; offset: number; duration?: number } | null = null;
  stopped = false;

  start(when = 0, offset = 0, duration?: number): void {
    this.started = { when, offset, duration };
  }

  stop(): void {
    this.stopped = true;
  }
}

class FakeContext implements AudioContextLike {
  state = "suspended";
  sampleRate = 32000;
  currentTime = 0;
  baseLatency = 0.005;
  destination = new FakeNode();
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  resumes = 0;

  resume(): Promise<void> {
    this.resumes += 1;
    this.state = "running";
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = "closed";
    return Promise.resolve();
  }

  decodeAudioData(): Promise<AudioBufferLike> {
    return Promise.resolve({
      duration: 30,
      length: 30 * this.sampleRate,
      numberOfChannels: 1,
      sampleRate: this.sampleRate,
    });
  }

  createBuffer(channels: number, length: number, sampleRate: number): AudioBufferLike {
    return { duration: length / sampleRate, length, numberOfChannels: channels, sampleRate };
  }

  createBufferSource(): FakeSource {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
}

const PACK: AudioCue[] = [
  {
    id: "bgm_student_day",
    file: "ogg/bgm/bgm_student_day.ogg",
    mp3: "mp3/bgm/bgm_student_day.mp3",
    type: "bgm",
    loop: true,
    volume: 0.8,
    category: "bgm",
  },
  {
    id: "bgm_student_night",
    file: "ogg/bgm/bgm_student_night.ogg",
    mp3: "mp3/bgm/bgm_student_night.mp3",
    type: "bgm",
    loop: true,
    volume: 0.8,
    category: "bgm",
  },
  {
    id: "sfx_ui_click",
    file: "ogg/sfx/sfx_ui_click.ogg",
    mp3: "mp3/sfx/sfx_ui_click.mp3",
    type: "sfx",
    loop: false,
    volume: 1,
    category: "ui",
  },
  { id: "sfx_phase_noon", file: "ogg/sfx/sfx_phase_noon.ogg", type: "sfx", loop: false, volume: 0.7, category: "time" },
  { id: "sfx_phase_evening", file: "ogg/sfx/sfx_phase_evening.ogg", type: "sfx", loop: false, volume: 0.7, category: "time" },
  { id: "sfx_phase_night", file: "ogg/sfx/sfx_phase_night.ogg", type: "sfx", loop: false, volume: 0.7, category: "time" },
  { id: "sfx_sleep", file: "ogg/sfx/sfx_sleep.ogg", type: "sfx", loop: false, volume: 1, category: "time" },
];

const MP3_DELAY_SAMPLES = 1105;
const SPRITE_RATE = 32000;
const MP3_LEAD = 0.04;

function slice(offset: number, duration: number) {
  return {
    ogg: { offset, duration },
    mp3: { offset: offset + MP3_DELAY_SAMPLES / SPRITE_RATE, duration },
  };
}

const CLICK = slice(0, 0.045);
const NOON = slice(1.2, 0.2);
const EVENING = slice(2.4, 0.2);
const NIGHT = slice(3.6, 0.2);
const SLEEP = slice(4.8, 0.5);

const OFFSETS: SpriteMap = {
  sampleRate: SPRITE_RATE,
  channels: 1,
  ogg: {
    file: "sprite/sfx.ogg",
    delaySamples: 0,
    cues: {
      sfx_ui_click: CLICK.ogg,
      sfx_phase_noon: NOON.ogg,
      sfx_phase_evening: EVENING.ogg,
      sfx_phase_night: NIGHT.ogg,
      sfx_sleep: SLEEP.ogg,
    },
  },
  mp3: {
    file: "sprite/sfx.mp3",
    delaySamples: MP3_DELAY_SAMPLES,
    cues: {
      sfx_ui_click: CLICK.mp3,
      sfx_phase_noon: NOON.mp3,
      sfx_phase_evening: EVENING.mp3,
      sfx_phase_night: NIGHT.mp3,
      sfx_sleep: SLEEP.mp3,
    },
  },
  bgm: {
    bgm_student_day: { mp3LeadSeconds: MP3_LEAD },
    bgm_student_night: { mp3LeadSeconds: MP3_LEAD },
  },
};

function harness(format: "ogg" | "mp3" = "ogg") {
  const ctx = new FakeContext();
  const calls: string[] = [];
  const jobs: Array<() => Promise<void>> = [];
  const latencies: Array<{ ms: number; id: string }> = [];
  let clock = 0;
  const engine = createAudioEngine({
    createContext: () => ctx,
    format,
    fadeMs: 0,
    now: () => clock,
    onLatency: (ms, id) => latencies.push({ ms, id }),
    scheduleIdle: (work) => {
      jobs.push(() => Promise.resolve(work()));
    },
    fetch: async (input) => {
      calls.push(input);
      if (input.endsWith("/audio/manifest.json")) {
        return { ok: true, json: async () => PACK, arrayBuffer: async () => new ArrayBuffer(0) };
      }
      if (input.endsWith("/audio/sprite/offsets.json")) {
        return { ok: true, json: async () => OFFSETS, arrayBuffer: async () => new ArrayBuffer(0) };
      }
      if (input.startsWith("/audio/")) {
        return { ok: true, json: async () => null, arrayBuffer: async () => new ArrayBuffer(8) };
      }
      return { ok: false, json: async () => null, arrayBuffer: async () => new ArrayBuffer(0) };
    },
  });
  return {
    ctx,
    engine,
    calls,
    latencies,
    setClock(value: number) {
      clock = value;
    },
    async flush() {
      const job = jobs.shift();
      if (job) await job();
    },
  };
}

function masterGain(ctx: FakeContext): FakeGain {
  const master = ctx.gains.find((gain) => gain.dest === ctx.destination);
  if (!master) throw new Error("missing master gain");
  return master;
}

function sfxStarts(ctx: FakeContext): FakeSource[] {
  return ctx.sources.filter((source) => source.buffer !== null && source.buffer.length !== 1 && !source.loop);
}

function phaseChange(phase: PhaseId, previous: PhaseId): TimeEvent {
  return { type: "phaseChanged", phase, previous, day: 1, totalMinutes: 0 };
}

describe("audio manifest", () => {
  it("parses an array or a cues object and drops bad rows", () => {
    expect(parseManifest([{ id: "ui_click", file: "ui_click", type: "sfx", loop: false, volume: 2 }])).toEqual([
      { id: "ui_click", file: "ui_click", type: "sfx", category: "ui", loop: false, volume: 1 },
    ]);
    expect(
      parseManifest({
        assets: [{ id: "bgm_student_day", type: "bgm", file: "ogg/bgm/bgm_student_day.ogg", mp3: "mp3/bgm/bgm_student_day.mp3", loop: true, volume: 0.5 }],
      })[0],
    ).toMatchObject({
      id: "bgm_student_day",
      type: "bgm",
      mp3: "mp3/bgm/bgm_student_day.mp3",
      loop: true,
    });
    expect(parseManifest({ nope: true })).toEqual([]);
    expect(parseManifest(null)).toEqual([]);
  });

  it("keeps BGM on ogg and offers mp3 only as an SFX fallback", () => {
    const day = PACK[0]!;
    const night = PACK[1]!;
    const click = PACK[2]!;
    expect(cueUrls(day)).toEqual(["/audio/ogg/bgm/bgm_student_day.ogg"]);
    expect(cueUrls(night)).toEqual(["/audio/ogg/bgm/bgm_student_night.ogg"]);
    expect(cueUrls(click)).toEqual([
      "/audio/ogg/sfx/sfx_ui_click.ogg",
      "/audio/mp3/sfx/sfx_ui_click.mp3",
    ]);
    expect(cueUrls(day).some((url) => url.endsWith(".mp3"))).toBe(false);
    expect(bgmUrl(day, "ogg")).toBe("/audio/ogg/bgm/bgm_student_day.ogg");
    expect(bgmUrl(day, "mp3")).toBe("/audio/mp3/bgm/bgm_student_day.mp3");
    expect(bgmLeadSeconds(OFFSETS, "ogg", "bgm_student_day")).toBe(0);
    expect(bgmLeadSeconds(OFFSETS, "mp3", "bgm_student_day")).toBe(MP3_LEAD);
    expect(preferredAudioFormat(() => "probably")).toBe("ogg");
    expect(preferredAudioFormat(() => "maybe")).toBe("ogg");
    expect(preferredAudioFormat(() => "")).toBe("mp3");
    expect(parseSpriteMap(null)).toBeNull();
  });

  it("clamps bus gain and ignores a bad saved payload", () => {
    expect(busGain(0.5, 0.5, false)).toBe(0.25);
    expect(busGain(1, 1, true)).toBe(0);
    expect(DEFAULT_AUDIO_LEVELS.music).toBe(0.5);
    expect(DEFAULT_AUDIO_LEVELS.sfx).toBe(0.8);
    expect(parseAudioSettings("nope", DEFAULT_AUDIO_LEVELS)).toEqual(DEFAULT_AUDIO_LEVELS);
    expect(parseAudioSettings(JSON.stringify({ v: 2, music: 0 }), DEFAULT_AUDIO_LEVELS)).toEqual(
      DEFAULT_AUDIO_LEVELS,
    );
    const stored = parseAudioSettings(
      serializeAudioSettings({ music: 0.3, sfx: 1.4, muted: true }),
      DEFAULT_AUDIO_LEVELS,
    );
    expect(stored).toEqual({ music: 0.3, sfx: 1, muted: true });
    expect(AUDIO_STORAGE_KEY).toBe("devlife:audio:v1");
  });
});

describe("sound icons", () => {
  const names = ["sound_on", "sound_off", "volume_low", "volume_high"] as const;

  it("scales the 44px native icons to 22px and does not look for an x4 file", () => {
    const files = names.map((name) => `icon_${name}.png`);
    for (const name of names) {
      expect(resolveShippedIcon(name, 22, files)).toEqual({
        src: `/ui/icons/icon_${name}.png`,
        displayPx: 22,
      });
    }
  });

  it("ships each sound icon as a 44×44 png", () => {
    for (const name of names) {
      const file = path.join(process.cwd(), "public/ui/icons", `icon_${name}.png`);
      const bytes = fs.readFileSync(file);
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(bytes.readUInt32BE(16)).toBe(44);
      expect(bytes.readUInt32BE(20)).toBe(44);
      expect(
        fs.existsSync(path.join(process.cwd(), "public/ui/icons", `icon_${name}_x4.png`)),
      ).toBe(false);
    }
  });
});

describe("audio cues", () => {
  const brackets = SIM_CATALOG.config.rank_brackets;

  it("uses the day bed for morning and noon, and the night bed after that", () => {
    expect(bgmBedForPhase("morning")).toBe("day");
    expect(bgmBedForPhase("noon")).toBe("day");
    expect(bgmBedForPhase("evening")).toBe("night");
    expect(bgmBedForPhase("night")).toBe("night");
    expect(bgmIdForPhase("noon")).toBe("bgm_student_day");
    expect(bgmIdForPhase("evening")).toBe("bgm_student_night");
    expect(shouldCrossfadeBgm("morning", "noon")).toBe(false);
    expect(shouldCrossfadeBgm("noon", "evening")).toBe(true);
  });

  it("plays one time-skip sting for a multi-hour jump, not for sleep or a single hour", () => {
    const oneHour = planTimeAudio([
      { type: "hourChanged", day: 1, hour: 9, totalMinutes: 9 * 60 },
    ]);
    expect(oneHour.timeSkip).toBe(false);

    const skip = planTimeAudio([
      { type: "hourChanged", day: 1, hour: 10, totalMinutes: 10 * 60 },
      { type: "hourChanged", day: 1, hour: 11, totalMinutes: 11 * 60 },
      phaseChange("noon", "morning"),
    ]);
    expect(skip.timeSkip).toBe(true);
    expect(skip.bgmPhase).toBe("noon");
    expect(shouldCrossfadeBgm(skip.bgmPrevious!, skip.bgmPhase!)).toBe(false);

    const sleep = planTimeAudio([
      { type: "hourChanged", day: 2, hour: 6, totalMinutes: 30 * 60 },
      phaseChange("morning", "night"),
      { type: "dayStarted", day: 2, totalMinutes: 30 * 60 },
      { type: "sleep", fromTotalMinutes: 22 * 60, toTotalMinutes: 30 * 60, day: 2 },
    ]);
    expect(sleep.sleep).toBe(true);
    expect(sleep.timeSkip).toBe(false);
    expect(sleep.dayStarted).toBe(false);
    expect(sleep.phaseChimes).toEqual(["morning"]);
    expect(shouldCrossfadeBgm("night", "morning")).toBe(true);
  });

  it("maps money direction and rank changes, and skips ids the manifest does not have", () => {
    expect(cueKeysForGameEvent({ type: "moneyChanged", delta: 100, money: 100 }, brackets)).toEqual([
      "moneyIn",
    ]);
    expect(cueKeysForGameEvent({ type: "moneyChanged", delta: -50, money: 50 }, brackets)).toEqual([
      "moneyOut",
    ]);
    expect(cueKeysForGameEvent({ type: "moneyChanged", delta: 0, money: 50 }, brackets)).toEqual([]);
    expect(
      cueKeysForGameEvent({ type: "skillLevelUp", skillId: "frontend", level: 2, rankId: "intern" }, brackets),
    ).toEqual(["levelUp"]);
    expect(
      cueKeysForGameEvent({ type: "skillLevelUp", skillId: "frontend", level: 3, rankId: "junior" }, brackets),
    ).toEqual(["rankUp", "levelUp"]);
    expect(resolveCueKey(["sfx_ui_click"], "hover")).toBeNull();
    expect(resolveCueKey(["sfx_ui_click", "sfx_ui_hover"], "hover")).toBe("sfx_ui_hover");
    expect(
      cueKeysForGameEvent({ type: "energyChanged", delta: -15, energy: 18 }, brackets),
    ).toEqual(["energyLow"]);
    expect(
      cueKeysForGameEvent({ type: "energyChanged", delta: -5, energy: 10 }, brackets),
    ).toEqual([]);
    expect(
      cueKeysForGameEvent({ type: "energyChanged", delta: 30, energy: 100 }, brackets),
    ).toEqual(["energyRestored"]);
  });

  it("plays a locked cue for aria-disabled controls and a tab cue for tabs", () => {
    expect(
      cueForHit({ sfx: null, ariaDisabled: true, role: null, tag: "button", disabled: false }, "down"),
    ).toBe("locked");
    expect(
      cueForHit({ sfx: null, ariaDisabled: false, role: "tab", tag: "button", disabled: false }, "down"),
    ).toBe("tab");
    expect(
      cueForHit({ sfx: "none", ariaDisabled: false, role: null, tag: "button", disabled: false }, "down"),
    ).toBeNull();
    expect(
      cueForHit({ sfx: null, ariaDisabled: false, role: null, tag: "button", disabled: false }, "over"),
    ).toBe("hover");
  });
});

describe("audio engine", () => {
  it("decodes one sprite at startup and does not fetch BGM until idle after unlock", async () => {
    const audio = harness();
    await audio.engine.preloadSfx();
    expect(audio.calls).toEqual([
      "/audio/manifest.json",
      "/audio/sprite/offsets.json",
      "/audio/sprite/sfx.ogg",
    ]);
    expect(audio.ctx.sources).toHaveLength(0);

    audio.engine.setSettings({ music: 1, sfx: 1, muted: false });
    audio.engine.notePhase("morning");
    audio.engine.unlock();
    expect(audio.ctx.resumes).toBe(1);
    const silence = audio.ctx.sources.find((source) => source.buffer?.length === 1);
    expect(silence?.dest).toBe(audio.ctx.destination);
    expect(silence?.started).toEqual({ when: 0, offset: 0, duration: undefined });
    expect(audio.engine.bedUrl()).toBeNull();
    expect(audio.calls.some((url) => url.includes("bgm"))).toBe(false);

    await audio.flush();
    expect(audio.engine.bedUrl()).toBe("/audio/ogg/bgm/bgm_student_day.ogg");
    const bed = audio.ctx.sources.find((source) => source.loop);
    expect(bed?.loopStart).toBe(0);
    expect(bed?.started?.offset).toBe(0);
    expect(bed?.loopEnd).toBe(30);
    const fade = bed?.dest as FakeGain;
    expect(fade.gain.value).toBe(0.8);
    expect((fade.dest as FakeGain).gain.value).toBe(1);
    expect(audio.calls.some((url) => url.endsWith(".mp3"))).toBe(false);
  });

  it("plays a sprite slice on pointerdown and keeps the bed when the phase stays on it", async () => {
    const audio = harness();
    await audio.engine.preloadSfx();
    audio.engine.setSettings({ music: 1, sfx: 0.5, muted: false });
    audio.engine.notePhase("morning");
    audio.engine.unlock();
    await audio.flush();
    audio.setClock(80);
    audio.engine.playKey("click", 50);
    expect(audio.latencies).toEqual([{ ms: 30, id: "sfx_ui_click" }]);
    const click = sfxStarts(audio.ctx).at(-1)!;
    expect(click.started).toEqual({ when: 0, offset: CLICK.ogg.offset, duration: CLICK.ogg.duration });
    const trim = click.dest as FakeGain;
    expect(trim.gain.value).toBe(1);
    const uiBus = trim.dest as FakeGain;
    expect(uiBus.gain.value).toBe(0.5);
    expect(uiBus.dest).toBe(masterGain(audio.ctx));

    const loops = () => audio.ctx.sources.filter((source) => source.loop);
    expect(loops()).toHaveLength(1);
    audio.engine.applyTimePlan(planTimeAudio([phaseChange("noon", "morning")]));
    expect(audio.engine.bedUrl()).toBe("/audio/ogg/bgm/bgm_student_day.ogg");
    expect(loops()).toHaveLength(1);
    const noon = sfxStarts(audio.ctx).at(-1)!;
    expect(noon.started?.offset).toBe(NOON.ogg.offset);
    expect((noon.dest as FakeGain).dest).not.toBe(uiBus);

    const day = loops()[0]!;
    audio.engine.applyTimePlan(planTimeAudio([phaseChange("evening", "noon")]));
    expect(audio.engine.bedUrl()).toBe("/audio/ogg/bgm/bgm_student_day.ogg");
    await audio.flush();
    expect(audio.engine.bedUrl()).toBe("/audio/ogg/bgm/bgm_student_night.ogg");
    expect(day.stopped).toBe(true);
    expect(audio.calls.some((url) => url.endsWith(".mp3"))).toBe(false);
  });

  it("uses the mp3 sprite offset, including encoder delay, and skips the mp3 bed lead", async () => {
    const audio = harness("mp3");
    await audio.engine.preloadSfx();
    expect(audio.calls).toContain("/audio/sprite/sfx.mp3");
    audio.engine.notePhase("morning");
    audio.engine.unlock();
    audio.engine.playKey("click", 0);
    const click = sfxStarts(audio.ctx).at(-1)!;
    expect(click.started?.offset).toBeCloseTo(CLICK.mp3.offset, 6);
    expect(click.started?.offset).toBeCloseTo(CLICK.ogg.offset + MP3_DELAY_SAMPLES / SPRITE_RATE, 6);
    await audio.flush();
    expect(audio.engine.bedUrl()).toBe("/audio/mp3/bgm/bgm_student_day.mp3");
    const bed = audio.ctx.sources.find((source) => source.loop);
    expect(bed?.loopStart).toBeCloseTo(MP3_LEAD, 6);
    expect(bed?.started?.offset).toBeCloseTo(MP3_LEAD, 6);
  });

  it("does not start playback before the first gesture and stays quiet for a missing cue", async () => {
    const audio = harness();
    await audio.engine.preloadSfx();
    audio.engine.playKey("click");
    audio.engine.applyTimePlan(planTimeAudio([phaseChange("night", "evening")]));
    expect(audio.ctx.sources).toHaveLength(0);
    expect(audio.engine.bedUrl()).toBeNull();
    expect(audio.calls.some((url) => url.includes("bgm"))).toBe(false);
    audio.engine.unlock();
    expect(audio.engine.bedUrl()).toBeNull();
    const before = audio.ctx.sources.length;
    audio.engine.playKey("hover");
    expect(audio.ctx.sources).toHaveLength(before);
    await audio.flush();
    expect(audio.engine.bedUrl()).toBe("/audio/ogg/bgm/bgm_student_night.ogg");
  });

  it("keeps mute and the sfx slider on the gain nodes", async () => {
    const audio = harness();
    await audio.engine.preloadSfx();
    audio.engine.setSettings({ music: 1, sfx: 0.25, muted: true });
    audio.engine.notePhase("morning");
    audio.engine.unlock();
    await audio.flush();
    expect(masterGain(audio.ctx).gain.value).toBe(0);
    audio.engine.playKey("click");
    const trim = sfxStarts(audio.ctx).at(-1)!.dest as FakeGain;
    expect((trim.dest as FakeGain).gain.value).toBe(0.25);
    audio.engine.setSettings({ music: 0.5, sfx: 0.9, muted: false });
    expect(masterGain(audio.ctx).gain.value).toBe(1);
    expect((trim.dest as FakeGain).gain.value).toBe(0.9);
    const bed = audio.ctx.sources.find((source) => source.loop);
    expect((bed?.dest as FakeGain).dest).toMatchObject({ gain: { value: 0.5 } });
  });
});

const manifestPath = path.join(process.cwd(), "public/audio/manifest.json");
const hasManifest = fs.existsSync(manifestPath);

describe.skipIf(!hasManifest)("shipped audio pack", () => {
  it("includes both student beds and resolves mapped cues", () => {
    const cues = parseManifest(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
    const ids = cues.map((cue) => cue.id);
    const day = cues.find((cue) => cue.id === "bgm_student_day");
    const night = cues.find((cue) => cue.id === "bgm_student_night");
    expect(day?.type).toBe("bgm");
    expect(night?.type).toBe("bgm");
    expect(cueUrls(day!)).toEqual(["/audio/ogg/bgm/bgm_student_day.ogg"]);
    expect(cueUrls(night!)).toEqual(["/audio/ogg/bgm/bgm_student_night.ogg"]);
    expect(cues.filter((cue) => cue.type === "sfx")).toHaveLength(29);
    expect(fs.existsSync(path.join(process.cwd(), "public/audio/CREDITS.md"))).toBe(true);

    const phaseKeys = ["phaseMorning", "phaseNoon", "phaseEvening", "phaseNight"] as const;
    const required: CueKey[] = [
      ...phaseKeys,
      "timeSkip",
      "sleep",
      "dayStarted",
      "jobAccepted",
      "jobCompleted",
      "jobFailed",
      "xp",
      "levelUp",
      "rankUp",
      "milestone",
      "moneyIn",
      "moneyOut",
      "course",
      "click",
      "hover",
      "panelOpen",
      "panelClose",
      "tab",
      "locked",
      "toast",
      "energyLow",
      "energyRestored",
    ];
    const missing = required.filter((key) => resolveCueKey(ids, key) == null);
    expect(missing, `unmapped ids: ${ids.join(", ")}`).toEqual([]);

    for (const cue of cues) {
      for (const url of cueUrls(cue)) {
        const relative = url.replace(/^\/audio\//, "");
        expect(fs.existsSync(path.join(process.cwd(), "public/audio", relative)), url).toBe(true);
        if (cue.type === "bgm") expect(url.endsWith(".ogg")).toBe(true);
      }
    }

    const offsets = parseSpriteMap(
      JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/audio/sprite/offsets.json"), "utf8")),
    );
    expect(offsets?.sampleRate).toBe(32000);
    expect(offsets?.channels).toBe(1);
    expect(fs.existsSync(path.join(process.cwd(), "public/audio/sprite/sfx.ogg"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "public/audio/sprite/sfx.mp3"))).toBe(true);
    const sfx = cues.filter((cue) => cue.type === "sfx");
    expect(Object.keys(offsets!.ogg.cues)).toHaveLength(sfx.length);
    expect(offsets!.mp3.delaySamples).toBeGreaterThan(0);
    const shift = (offsets!.mp3.delaySamples - offsets!.ogg.delaySamples) / offsets!.sampleRate;
    for (const cue of sfx) {
      const ogg = offsets!.ogg.cues[cue.id];
      const mp3 = offsets!.mp3.cues[cue.id];
      expect(ogg?.duration, cue.id).toBeGreaterThan(0);
      expect(mp3?.duration, cue.id).toBeCloseTo(ogg!.duration, 5);
      expect(mp3!.offset - ogg!.offset, cue.id).toBeCloseTo(shift, 5);
    }
    expect(offsets!.bgm.bgm_student_day?.mp3LeadSeconds).toBeGreaterThan(0.01);
    expect(offsets!.bgm.bgm_student_night?.mp3LeadSeconds).toBeGreaterThan(0.01);
    expect(offsets!.bgm.bgm_student_day?.mp3LeadSeconds).toBeLessThan(0.08);
  });
});
