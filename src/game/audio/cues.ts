import type { GameEvent } from "../events/types";
import { rankBracketForLevel } from "../knowledge/logic";
import type { RankBracket } from "../career/types";
import type { PhaseId } from "../time/config";
import type { TimeEvent } from "../time/types";
import { resolveCueId } from "./manifest";

export const BGM_DAY_ID = "bgm_student_day";
export const BGM_NIGHT_ID = "bgm_student_night";

export type BgmBed = "day" | "night";

/** Morning and noon share the day bed. Evening and night share the night bed. */
export function bgmBedForPhase(phase: PhaseId): BgmBed {
  return phase === "morning" || phase === "noon" ? "day" : "night";
}

export function bgmIdForPhase(phase: PhaseId): string {
  return bgmBedForPhase(phase) === "day" ? BGM_DAY_ID : BGM_NIGHT_ID;
}

/** Same-bed phase changes (Sáng → Trưa) keep the current loop running. */
export function shouldCrossfadeBgm(from: PhaseId, to: PhaseId): boolean {
  return bgmBedForPhase(from) !== bgmBedForPhase(to);
}

export type CueKey =
  | "phaseMorning"
  | "phaseNoon"
  | "phaseEvening"
  | "phaseNight"
  | "phase"
  | "hour"
  | "sleep"
  | "dayStarted"
  | "jobAccepted"
  | "jobCompleted"
  | "jobFailed"
  | "xp"
  | "levelUp"
  | "rankUp"
  | "milestone"
  | "moneyIn"
  | "moneyOut"
  | "course"
  | "click"
  | "hover"
  | "panelOpen"
  | "panelClose"
  | "tab"
  | "locked"
  | "toast";

export const CUE_KEYS = [
  "phaseMorning",
  "phaseNoon",
  "phaseEvening",
  "phaseNight",
  "phase",
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
] as const satisfies readonly CueKey[];

/**
 * Manifest ids tried in order. The pack is the source of truth: a key with
 * no matching id is silent. Aliases cover likely spellings; exact ids win first.
 */
export const CUE_IDS: Record<CueKey, readonly string[]> = {
  phaseMorning: ["phase_morning", "sfx_phase_morning", "chime_morning", "morning"],
  phaseNoon: ["phase_noon", "sfx_phase_noon", "chime_noon", "noon"],
  phaseEvening: ["phase_evening", "sfx_phase_evening", "chime_evening", "evening"],
  phaseNight: ["phase_night", "sfx_phase_night", "chime_night", "night"],
  phase: ["phase_chime", "sfx_phase", "ui_phase", "chime", "phase"],
  hour: ["hour_chime", "sfx_hour", "ui_hour", "hour"],
  sleep: ["sleep", "sfx_sleep", "ui_sleep"],
  dayStarted: ["day_started", "sfx_day_start", "day_start", "ui_day"],
  jobAccepted: ["job_accepted", "sfx_job_accept", "job_accept"],
  jobCompleted: ["job_completed", "sfx_job_complete", "job_complete", "job_success"],
  jobFailed: ["job_failed", "sfx_job_fail", "job_fail"],
  xp: ["xp_gain", "sfx_xp", "xp", "skill_xp"],
  levelUp: ["level_up", "sfx_level_up", "skill_level_up"],
  rankUp: ["rank_up", "sfx_rank_up", "skill_rank_up"],
  milestone: ["milestone", "sfx_milestone", "freelance_milestone", "milestone_reached"],
  moneyIn: ["money_in", "sfx_money_in", "coin", "cash_in"],
  moneyOut: ["money_out", "sfx_money_out", "cash_out", "spend"],
  course: ["course_purchase", "sfx_course", "study_completed", "study_complete", "course"],
  click: ["ui_click", "click", "sfx_click"],
  hover: ["ui_hover", "hover", "sfx_hover"],
  panelOpen: ["ui_panel_open", "panel_open", "sfx_panel_open"],
  panelClose: ["ui_panel_close", "panel_close", "sfx_panel_close"],
  tab: ["ui_tab", "tab_switch", "sfx_tab", "tab"],
  locked: ["ui_locked", "sfx_locked", "locked", "ui_deny"],
  toast: ["ui_toast", "toast", "sfx_toast", "notification"],
};

const PHASE_CUE: Record<PhaseId, CueKey> = {
  morning: "phaseMorning",
  noon: "phaseNoon",
  evening: "phaseEvening",
  night: "phaseNight",
};

export function phaseCueKey(phase: PhaseId): CueKey {
  return PHASE_CUE[phase];
}

export type TimeAudioPlan = {
  phaseChimes: PhaseId[];
  hourChime: boolean;
  dayStarted: boolean;
  sleep: boolean;
  bgmPhase: PhaseId | null;
  bgmPrevious: PhaseId | null;
};

/**
 * One clock tick can emit several boundaries. Sleep and multi-hour skips
 * must not machine-gun the hour chime. The BGM follows only the destination phase.
 */
export function planTimeAudio(events: readonly TimeEvent[]): TimeAudioPlan {
  let bgmPhase: PhaseId | null = null;
  let bgmPrevious: PhaseId | null = null;
  let hours = 0;
  let dayStarted = false;
  let sleep = false;
  const phaseChimes: PhaseId[] = [];

  for (const event of events) {
    if (event.type === "phaseChanged") {
      phaseChimes.push(event.phase);
      bgmPhase = event.phase;
      bgmPrevious = event.previous;
    } else if (event.type === "hourChanged") {
      hours += 1;
    } else if (event.type === "dayStarted") {
      dayStarted = true;
    } else if (event.type === "sleep") {
      sleep = true;
    }
  }

  return {
    phaseChimes,
    hourChime: !sleep && hours === 1,
    dayStarted: dayStarted && !sleep,
    sleep,
    bgmPhase,
    bgmPrevious,
  };
}

export function cueKeysForGameEvent(
  event: GameEvent,
  brackets: readonly RankBracket[],
): CueKey[] {
  switch (event.type) {
    case "skillXpGained":
      return event.amount > 0 ? ["xp"] : [];
    case "skillLevelUp": {
      const previous = rankBracketForLevel(event.level - 1, brackets);
      return previous.id !== event.rankId ? ["rankUp", "levelUp"] : ["levelUp"];
    }
    case "studyCompleted":
      return ["course"];
    case "jobAccepted":
      return ["jobAccepted"];
    case "jobCompleted":
      return ["jobCompleted"];
    case "milestoneReached":
      return ["milestone"];
    case "moneyChanged":
      if (event.delta > 0) return ["moneyIn"];
      if (event.delta < 0) return ["moneyOut"];
      return [];
    default:
      return [];
  }
}

export function resolveCueKey(
  ids: Iterable<string>,
  key: CueKey,
): string | null {
  return resolveCueId(ids, CUE_IDS[key]);
}

export type PointerHit = {
  sfx: string | null;
  ariaDisabled: boolean;
  role: string | null;
  tag: string;
  disabled: boolean;
};

export function cueForHit(hit: PointerHit | null, kind: "down" | "over"): CueKey | null {
  if (!hit || hit.sfx === "none") return null;
  if (kind === "over") return "hover";
  if (hit.ariaDisabled || hit.disabled) return "locked";
  if (hit.role === "tab") return "tab";
  if (hit.tag === "button" || hit.role === "button") return "click";
  return null;
}
