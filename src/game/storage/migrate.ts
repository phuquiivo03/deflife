import { STAGES, type StageId } from "../config";
import { defaultCareer } from "../career/actions";
import { SIM_CATALOG } from "../career/content";
import {
  LOCAL_PLAYER_ID,
  SKILL_IDS,
  type CareerState,
  type JobStatus,
  type JobType,
  type PlayerEvent,
  type PlayerJob,
  type PlayerSkill,
  type PlayerStudyCompletion,
  type PlayerUnlock,
  type SkillId,
  type TaskBuildChoice,
  type TaskOutcome,
  type TaskRun,
  type TaskStep,
  type TaskTicketChoice,
} from "../career/types";
import type { Loadout } from "../types";
import { snapshot, totalMinutesFromPersisted } from "../time";
import { clampEnergy } from "../vitals/logic";

export type PersistedSave = {
  stage: StageId;
  loadouts: Record<StageId, Loadout>;
  showCharacter: boolean;
  totalMinutes: number;
  career: CareerState;
};

const JOB_STATUSES: readonly JobStatus[] = [
  "offered",
  "active",
  "completed",
  "failed",
  "expired",
  "quit",
  "fired",
];

function emptyLoadouts(): Record<StageId, Loadout> {
  return { student: {}, junior: {}, senior: {} };
}

function isStage(value: unknown): value is StageId {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}

function isSkillId(value: unknown): value is SkillId {
  return typeof value === "string" && (SKILL_IDS as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeSkills(value: unknown): PlayerSkill[] {
  const rows = Array.isArray(value) ? value : [];
  const byId = new Map<SkillId, PlayerSkill>();
  for (const row of rows) {
    if (!isRecord(row) || !isSkillId(row.skill_id)) continue;
    const level = Number(row.level);
    const xp = Number(row.xp);
    byId.set(row.skill_id, {
      skill_id: row.skill_id,
      level: Number.isFinite(level) ? Math.max(1, Math.min(10, Math.floor(level))) : 1,
      xp: Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0,
    });
  }
  return SKILL_IDS.map(
    (skill_id) => byId.get(skill_id) ?? { skill_id, level: 1, xp: 0 },
  );
}

function normalizeJobs(value: unknown): PlayerJob[] {
  if (!Array.isArray(value)) return [];
  const jobs: PlayerJob[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    if (typeof row.id !== "string" || typeof row.template_id !== "string") continue;
    const status = JOB_STATUSES.find((item) => item === row.status);
    const jobType: JobType = row.job_type === "remote" ? "remote" : "freelance";
    if (!status) continue;
    jobs.push({
      id: row.id,
      template_id: row.template_id,
      job_type: jobType,
      status,
      hours_required: num(row.hours_required),
      progress_hours: num(row.progress_hours),
      bugs: num(row.bugs),
      pay: num(row.pay),
      offered_day: Math.max(1, num(row.offered_day, 1)),
      accepted_day: nullableNum(row.accepted_day),
      deadline_day: nullableNum(row.deadline_day),
      finished_day: nullableNum(row.finished_day),
      missed_days: num(row.missed_days),
      task_run: normalizeTaskRun(row.task_run),
    });
  }
  return jobs;
}

function normalizeCompletions(value: unknown): PlayerStudyCompletion[] {
  if (!Array.isArray(value)) return [];
  const byId = new Map<string, PlayerStudyCompletion>();
  for (const row of value) {
    if (!isRecord(row) || typeof row.activity_id !== "string" || row.activity_id.length === 0) {
      continue;
    }
    if (!isSkillId(row.skill_id)) continue;
    byId.set(row.activity_id, {
      activity_id: row.activity_id,
      skill_id: row.skill_id,
      xp_gained: num(row.xp_gained),
      completed_day: Math.max(1, num(row.completed_day, 1)),
    });
  }
  return [...byId.values()];
}

function normalizeUnlocks(value: unknown): PlayerUnlock[] {
  if (!Array.isArray(value)) return [];
  const unlocks: PlayerUnlock[] = [];
  for (const row of value) {
    if (!isRecord(row) || typeof row.milestone_id !== "string") continue;
    unlocks.push({
      milestone_id: row.milestone_id,
      reached_day: Math.max(1, num(row.reached_day, 1)),
    });
  }
  return unlocks;
}

function normalizeEvents(value: unknown): PlayerEvent[] {
  if (!Array.isArray(value)) return [];
  const events: PlayerEvent[] = [];
  for (const row of value) {
    if (!isRecord(row) || typeof row.id !== "string" || typeof row.type !== "string") {
      continue;
    }
    events.push({
      id: row.id,
      type: row.type,
      day: Math.max(1, num(row.day, 1)),
      payload: isRecord(row.payload) ? row.payload : {},
    });
  }
  return events;
}

const TASK_STEPS: readonly TaskStep[] = ["ticket", "build", "test", "result"];
const TICKET_CHOICES: readonly TaskTicketChoice[] = ["correct", "wrong", "ask"];
const BUILD_CHOICES: readonly TaskBuildChoice[] = ["careful", "rushed"];

function normalizeTaskRun(value: unknown): TaskRun | null {
  if (!isRecord(value)) return null;
  const step = TASK_STEPS.find((item) => item === value.step);
  if (!step) return null;
  const ticket = TICKET_CHOICES.find((item) => item === value.ticket) ?? null;
  const build = BUILD_CHOICES.find((item) => item === value.build) ?? null;
  const outcome: TaskOutcome | null =
    value.outcome === "success" || value.outcome === "fail" ? value.outcome : null;
  return {
    step,
    seed: num(value.seed),
    ticket,
    build,
    event_id: typeof value.event_id === "string" ? value.event_id : null,
    bugs_total: num(value.bugs_total),
    bugs_caught: num(value.bugs_caught),
    retries: num(value.retries),
    outcome,
    time_bonus_sec: Number.isFinite(Number(value.time_bonus_sec))
      ? Math.trunc(Number(value.time_bonus_sec))
      : 0,
  };
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function nullableNum(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
}

export function careerFromUnknown(
  value: unknown,
  day: number,
  minuteOfDay: number,
  stage: string,
): CareerState {
  const fresh = defaultCareer(day, minuteOfDay, stage, SIM_CATALOG);
  if (!isRecord(value)) return fresh;
  const players = isRecord(value.players) ? value.players : {};
  return {
    players: {
      id: typeof players.id === "string" ? players.id : LOCAL_PLAYER_ID,
      stage,
      game_day: day,
      game_minute: minuteOfDay,
      money: Number.isFinite(Number(players.money))
        ? Math.trunc(Number(players.money))
        : fresh.players.money,
      energy: Number.isFinite(Number(players.energy))
        ? clampEnergy(Number(players.energy), SIM_CATALOG.config.energy_max)
        : fresh.players.energy,
      reputation: num(players.reputation, fresh.players.reputation),
      freelance_completed: num(players.freelance_completed),
    },
    player_skills: normalizeSkills(value.player_skills),
    player_study_completions: normalizeCompletions(value.player_study_completions),
    player_jobs: normalizeJobs(value.player_jobs),
    player_unlocks: normalizeUnlocks(value.player_unlocks),
    player_events: normalizeEvents(value.player_events),
  };
}

/**
 * Persist version 5. Versions before 3 keep the room and the clock, and gain
 * a fresh career document. Version 3 keeps the career tables. Versions before
 * 4 have no course history, so every course is still uncompleted. Versions
 * before 5 have no task_run; normalize stores null.
 */
export function migrateSave(persisted: unknown, version: number): PersistedSave {
  const prev = isRecord(persisted) ? persisted : {};
  const stage = isStage(prev.stage) ? prev.stage : "student";
  const loadouts = isRecord(prev.loadouts)
    ? {
        student: isRecord(prev.loadouts.student)
          ? (prev.loadouts.student as Loadout)
          : {},
        junior: isRecord(prev.loadouts.junior) ? (prev.loadouts.junior as Loadout) : {},
        senior: isRecord(prev.loadouts.senior) ? (prev.loadouts.senior as Loadout) : {},
      }
    : emptyLoadouts();
  const showCharacter = typeof prev.showCharacter === "boolean" ? prev.showCharacter : true;
  const totalMinutes = totalMinutesFromPersisted(prev.totalMinutes, version);
  const snap = snapshot(totalMinutes);
  let career =
    version >= 3
      ? careerFromUnknown(prev.career, snap.day, snap.minuteOfDay, stage)
      : defaultCareer(snap.day, snap.minuteOfDay, stage, SIM_CATALOG);
  if (version < 4) {
    career = { ...career, player_study_completions: [] };
  }

  return {
    stage,
    loadouts,
    showCharacter,
    totalMinutes,
    career: {
      ...career,
      players: { ...career.players, stage, game_day: snap.day, game_minute: snap.minuteOfDay },
    },
  };
}
