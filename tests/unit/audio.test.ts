import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SIM_CATALOG } from "../../src/game/career/content";
import {
  bgmBedForPhase,
  bgmIdForPhase,
  cueForHit,
  cueKeysForGameEvent,
  planTimeAudio,
  resolveCueKey,
  shouldCrossfadeBgm,
} from "../../src/game/audio/cues";
import { createAudioEngine, type AudioSink } from "../../src/game/audio/engine";
import {
  busGain,
  cueUrls,
  parseManifest,
  type AudioCue,
} from "../../src/game/audio/manifest";
import {
  AUDIO_STORAGE_KEY,
  DEFAULT_AUDIO_LEVELS,
  parseAudioSettings,
  serializeAudioSettings,
} from "../../src/game/audio/settings";
import type { PhaseId } from "../../src/game/time/config";
import type { TimeEvent } from "../../src/game/time/types";

class FakeSink implements AudioSink {
  src = "";
  loop = false;
  volume = 1;
  paused = true;
  plays = 0;
  private errors: Array<() => void> = [];

  play(): Promise<void> {
    this.plays += 1;
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  addEventListener(type: "error", listener: () => void): void {
    if (type === "error") this.errors.push(listener);
  }

  emitError(): void {
    for (const listener of [...this.errors]) listener();
  }
}

function factory() {
  const sinks: FakeSink[] = [];
  return {
    sinks,
    createSink(): AudioSink {
      const sink = new FakeSink();
      sinks.push(sink);
      return sink;
    },
  };
}

const PACK: AudioCue[] = [
  { id: "bgm_student_day", file: "bgm_student_day", type: "bgm", loop: true, volume: 0.8 },
  { id: "bgm_student_night", file: "ogg/bgm_student_night.ogg", type: "bgm", loop: true, volume: 0.8 },
  { id: "ui_click", file: "ui_click", type: "sfx", loop: false, volume: 1 },
  { id: "phase_morning", file: "phase_morning", type: "sfx", loop: false, volume: 0.7 },
  { id: "phase_noon", file: "phase_noon", type: "sfx", loop: false, volume: 0.7 },
  { id: "phase_evening", file: "phase_evening", type: "sfx", loop: false, volume: 0.7 },
  { id: "sleep", file: "sleep", type: "sfx", loop: false, volume: 1 },
  { id: "hour_chime", file: "hour_chime", type: "sfx", loop: false, volume: 0.4 },
];

function phaseChange(phase: PhaseId, previous: PhaseId): TimeEvent {
  return { type: "phaseChanged", phase, previous, day: 1, totalMinutes: 0 };
}

describe("audio manifest", () => {
  it("parses an array or a cues object and drops bad rows", () => {
    expect(parseManifest([{ id: "ui_click", file: "ui_click", type: "sfx", loop: false, volume: 2 }])).toEqual([
      { id: "ui_click", file: "ui_click", type: "sfx", loop: false, volume: 1 },
    ]);
    expect(parseManifest({ sounds: [{ id: "bgm_student_day", type: "music" }] })[0]).toMatchObject({
      id: "bgm_student_day",
      type: "bgm",
      loop: true,
    });
    expect(parseManifest({ nope: true })).toEqual([]);
    expect(parseManifest(null)).toEqual([]);
  });

  it("keeps BGM on ogg and offers mp3 only as an SFX fallback", () => {
    const day = PACK[0]!;
    const night = PACK[1]!;
    const click = PACK[2]!;
    expect(cueUrls(day)).toEqual(["/audio/ogg/bgm_student_day.ogg"]);
    expect(cueUrls(night)).toEqual(["/audio/ogg/bgm_student_night.ogg"]);
    expect(cueUrls(click)).toEqual(["/audio/ogg/ui_click.ogg", "/audio/mp3/ui_click.mp3"]);
    expect(cueUrls(day).some((url) => url.endsWith(".mp3"))).toBe(false);
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

  it("skips the hour chime on sleep and on a multi-hour skip", () => {
    const oneHour = planTimeAudio([
      { type: "hourChanged", day: 1, hour: 9, totalMinutes: 9 * 60 },
    ]);
    expect(oneHour.hourChime).toBe(true);

    const skip = planTimeAudio([
      { type: "hourChanged", day: 1, hour: 10, totalMinutes: 10 * 60 },
      { type: "hourChanged", day: 1, hour: 11, totalMinutes: 11 * 60 },
      phaseChange("noon", "morning"),
    ]);
    expect(skip.hourChime).toBe(false);
    expect(skip.bgmPhase).toBe("noon");
    expect(shouldCrossfadeBgm(skip.bgmPrevious!, skip.bgmPhase!)).toBe(false);

    const sleep = planTimeAudio([
      { type: "hourChanged", day: 2, hour: 6, totalMinutes: 30 * 60 },
      phaseChange("morning", "night"),
      { type: "dayStarted", day: 2, totalMinutes: 30 * 60 },
      { type: "sleep", fromTotalMinutes: 22 * 60, toTotalMinutes: 30 * 60, day: 2 },
    ]);
    expect(sleep.sleep).toBe(true);
    expect(sleep.hourChime).toBe(false);
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
    expect(resolveCueKey(["ui_click"], "hover")).toBeNull();
    expect(resolveCueKey(["ui_click", "hover"], "hover")).toBe("hover");
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
  it("waits for unlock, loops ogg beds, and crossfades only when the bed changes", () => {
    const audio = factory();
    const engine = createAudioEngine({ createSink: audio.createSink, fadeMs: 0 });
    engine.setSettings({ music: 1, sfx: 1, muted: false });
    engine.notePhase("morning");
    engine.unlock();
    expect(engine.bedUrl()).toBeNull();

    engine.setManifest(PACK);
    expect(engine.bedUrl()).toBe("/audio/ogg/bgm_student_day.ogg");
    expect(audio.sinks).toHaveLength(1);
    expect(audio.sinks[0]).toMatchObject({ loop: true, paused: false, volume: 0.8 });

    engine.applyTimePlan(planTimeAudio([phaseChange("noon", "morning")]));
    expect(engine.bedUrl()).toBe("/audio/ogg/bgm_student_day.ogg");
    expect(audio.sinks).toHaveLength(2);
    expect(audio.sinks[1]!.src).toBe("/audio/ogg/phase_noon.ogg");

    engine.applyTimePlan(planTimeAudio([phaseChange("evening", "noon")]));
    expect(engine.bedUrl()).toBe("/audio/ogg/bgm_student_night.ogg");
    expect(audio.sinks[0]!.paused).toBe(true);
    const night = audio.sinks.find((sink) => sink.src.endsWith("bgm_student_night.ogg"));
    expect(night?.loop).toBe(true);
    expect(audio.sinks.some((sink) => sink.src.endsWith(".mp3"))).toBe(false);
  });

  it("falls back from ogg to mp3 for SFX and stays quiet when a cue is missing", () => {
    const audio = factory();
    const engine = createAudioEngine({ createSink: audio.createSink, fadeMs: 0 });
    engine.setManifest(PACK);
    engine.notePhase("morning");
    engine.unlock();
    const before = audio.sinks.length;
    engine.playKey("hover");
    expect(audio.sinks.length).toBe(before);

    engine.playKey("click");
    const click = audio.sinks.at(-1)!;
    expect(click.src).toBe("/audio/ogg/ui_click.ogg");
    click.emitError();
    expect(click.src).toBe("/audio/mp3/ui_click.mp3");
  });

  it("does not start playback before the first gesture", () => {
    const audio = factory();
    const engine = createAudioEngine({ createSink: audio.createSink, fadeMs: 0 });
    engine.setManifest(PACK);
    engine.playKey("click");
    engine.applyTimePlan(planTimeAudio([phaseChange("night", "evening")]));
    expect(audio.sinks).toHaveLength(0);
    expect(engine.bedUrl()).toBeNull();
    engine.unlock();
    expect(engine.bedUrl()).toBe("/audio/ogg/bgm_student_night.ogg");
  });

  it("silences the bed while muted", () => {
    const audio = factory();
    const engine = createAudioEngine({ createSink: audio.createSink, fadeMs: 0 });
    engine.setManifest(PACK);
    engine.setSettings({ music: 1, sfx: 1, muted: true });
    engine.notePhase("morning");
    engine.unlock();
    expect(audio.sinks[0]!.volume).toBe(0);
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
    expect(cueUrls(day!)).toEqual(["/audio/ogg/bgm_student_day.ogg"]);
    expect(cueUrls(night!)).toEqual(["/audio/ogg/bgm_student_night.ogg"]);
    const phaseKeys = ["phaseMorning", "phaseNoon", "phaseEvening", "phaseNight"] as const;
    const required = [
      ...phaseKeys,
      "hour",
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
    ] as const;
    const missing = required.filter((key) => {
      if (resolveCueKey(ids, key)) return false;
      return !(phaseKeys.includes(key as (typeof phaseKeys)[number]) && resolveCueKey(ids, "phase"));
    });
    expect(missing, `unmapped ids: ${ids.join(", ")}`).toEqual([]);
  });
});
