import type { GameEvent } from "../events/types";
import {
  addSkillXp,
  canStudyCourse,
  grantedXp,
  skillXpEvents,
  studyBlockReason,
} from "../knowledge/logic";
import { MINUTES_PER_DAY } from "../time/config";
import { advanceMinutes, snapshot } from "../time";
import {
  boardHasToday,
  jobEligibility,
  jobRequirementsFor,
  offerJob,
  selectBoardTemplates,
  skillNameMap,
} from "../jobs/logic";
import { applyEnergy, applyMoney, clampEnergy } from "../vitals/logic";
import {
  LOCAL_PLAYER_ID,
  SKILL_IDS,
  type CareerState,
  type PlayerEvent,
  type PlayerJob,
  type PlayerSkill,
  type PlayerStudyCompletion,
  type SimCatalog,
  type SkillId,
} from "./types";

export type ActionResult = {
  state: CareerState;
  events: GameEvent[];
  minutes: number;
  error: string | null;
};

function draft(state: CareerState, events: GameEvent[], minutes = 0): ActionResult {
  return { state, events, minutes, error: null };
}

function ok(state: CareerState, events: GameEvent[], minutes = 0): ActionResult {
  return { state: withEvents(state, events), events, minutes, error: null };
}

function fail(state: CareerState, error: string): ActionResult {
  return { state, events: [], minutes: 0, error };
}

function withEvents(state: CareerState, events: readonly GameEvent[]): CareerState {
  if (events.length === 0) return state;
  const start = state.player_events.length;
  const appended: PlayerEvent[] = events.map((event, index) => {
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(event)) {
      if (key !== "type") payload[key] = value;
    }
    return {
      id: `e-${start + index + 1}`,
      type: event.type,
      day: state.players.game_day,
      payload,
    };
  });
  return { ...state, player_events: [...state.player_events, ...appended] };
}

export function defaultCareer(
  day: number,
  minuteOfDay: number,
  stage: string,
  catalog: SimCatalog,
): CareerState {
  const { config } = catalog;
  return {
    players: {
      id: LOCAL_PLAYER_ID,
      stage,
      game_day: day,
      game_minute: minuteOfDay,
      money: config.starting_money,
      energy: clampEnergy(config.starting_energy, config.energy_max),
      reputation: config.starting_reputation,
      freelance_completed: 0,
    },
    player_skills: SKILL_IDS.map((skill_id) => ({ skill_id, level: 1, xp: 0 })),
    player_study_completions: [],
    player_jobs: [],
    player_unlocks: [],
    player_events: [],
  };
}

export function syncPlayerClock(
  state: CareerState,
  day: number,
  minuteOfDay: number,
  stage: string,
): CareerState {
  return {
    ...state,
    players: {
      ...state.players,
      stage,
      game_day: day,
      game_minute: minuteOfDay,
    },
  };
}

function skillById(skills: readonly PlayerSkill[], skillId: SkillId): PlayerSkill {
  return (
    skills.find((row) => row.skill_id === skillId) ?? {
      skill_id: skillId,
      level: 1,
      xp: 0,
    }
  );
}

function replaceSkill(skills: readonly PlayerSkill[], next: PlayerSkill): PlayerSkill[] {
  const exists = skills.some((row) => row.skill_id === next.skill_id);
  if (!exists) return [...skills, next];
  return skills.map((row) => (row.skill_id === next.skill_id ? next : row));
}

function setEnergy(state: CareerState, target: number, max: number): ActionResult {
  const energy = clampEnergy(target, max);
  const current = state.players.energy;
  if (current === energy) return draft(state, []);
  return draft(
    { ...state, players: { ...state.players, energy } },
    [{ type: "energyChanged", delta: energy - current, energy }],
  );
}

export function refreshBoard(state: CareerState, day: number, catalog: SimCatalog): ActionResult {
  const expired: PlayerJob[] = state.player_jobs.map((job) =>
    job.status === "offered" && job.offered_day < day
      ? { ...job, status: "expired" }
      : job,
  );
  if (boardHasToday(expired, day)) {
    return draft({ ...state, player_jobs: expired }, []);
  }

  const names = skillNameMap(catalog.skills);
  const picked = selectBoardTemplates(
    catalog.jobTemplates,
    day,
    catalog.config.board_size,
    (template) =>
      jobEligibility(
        state.players,
        state.player_skills,
        template,
        jobRequirementsFor(template.id, catalog.jobTemplateRequirements),
        names,
      ).ok,
  );
  const offered = picked.map((template) => offerJob(template, day));
  const events: GameEvent[] = [
    {
      type: "jobBoardRefreshed",
      day,
      jobIds: offered.map((job) => job.id),
    },
  ];
  return draft({ ...state, player_jobs: [...expired, ...offered] }, events);
}

export function ensureTodayBoard(
  state: CareerState,
  day: number,
  catalog: SimCatalog,
): ActionResult {
  const board = refreshBoard(state, day, catalog);
  return ok(board.state, board.events);
}

export function applyDayStarted(
  state: CareerState,
  day: number,
  minuteOfDay: number,
  stage: string,
  catalog: SimCatalog,
): ActionResult {
  const synced = syncPlayerClock(state, day, minuteOfDay, stage);
  const board = refreshBoard(synced, day, catalog);
  return ok(board.state, board.events);
}

/** Sleep sets energy to `energyOnSleep`. `dayStarted` does not touch energy. */
export function applyWake(state: CareerState, catalog: SimCatalog): ActionResult {
  const refilled = setEnergy(
    state,
    catalog.config.energyOnSleep,
    catalog.config.energy_max,
  );
  return ok(refilled.state, refilled.events);
}

function grantToSkill(
  state: CareerState,
  skillId: SkillId,
  amount: number,
  catalog: SimCatalog,
): { state: CareerState; events: GameEvent[] } {
  if (amount <= 0) return { state, events: [] };
  const current = skillById(state.player_skills, skillId);
  const applied = addSkillXp(current, amount, catalog.skillLevelXp);
  const events = skillXpEvents(skillId, applied, catalog.config.rank_brackets);
  return {
    state: {
      ...state,
      player_skills: replaceSkill(state.player_skills, applied.skill),
    },
    events,
  };
}

export function applyStudy(
  state: CareerState,
  activityId: string,
  catalog: SimCatalog,
): ActionResult {
  const activity = catalog.studyActivities.find((row) => row.id === activityId);
  if (!activity) return fail(state, "Không tìm thấy khóa học");

  const completions = state.player_study_completions ?? [];
  if (!canStudyCourse(activity, completions)) return fail(state, "Đã học khóa này");

  const reason = studyBlockReason(
    state.players.money,
    state.players.energy,
    activity,
  );
  if (reason) return fail(state, reason);

  const money = applyMoney(state.players.money, -activity.price);
  const energy = applyEnergy(
    state.players.energy,
    -activity.energy,
    catalog.config.energy_max,
  );
  let next: CareerState = {
    ...state,
    players: { ...state.players, money, energy },
  };
  const events: GameEvent[] = [
    { type: "moneyChanged", delta: -activity.price, money },
    { type: "energyChanged", delta: -activity.energy, energy },
  ];

  const grants = catalog.studyActivityXp.filter((row) => row.activity_id === activity.id);
  let xpShown = 0;
  for (const grant of grants) {
    const skill = skillById(next.player_skills, grant.skill_id);
    const amount = grantedXp(grant.xp, skill.level, "study", catalog.config);
    const applied = grantToSkill(next, grant.skill_id, amount, catalog);
    next = applied.state;
    events.push(...applied.events);
    xpShown += amount;
  }
  const minutes = activity.hours * 60;
  const completion: PlayerStudyCompletion = {
    activity_id: activity.id,
    skill_id: activity.skill_id,
    xp_gained: xpShown,
    completed_day: studyCompletedDay(state, minutes),
  };
  next = {
    ...next,
    player_study_completions: [
      ...completions.filter((row) => row.activity_id !== activity.id),
      completion,
    ],
  };
  events.push({
    type: "studyCompleted",
    activityId: activity.id,
    skillId: activity.skill_id,
    xp: xpShown,
  });

  return ok(next, events, minutes);
}

/** Day the clock shows after the course hours, using the same advance as the store. */
function studyCompletedDay(state: CareerState, minutes: number): number {
  const start =
    (state.players.game_day - 1) * MINUTES_PER_DAY + state.players.game_minute;
  return snapshot(advanceMinutes(start, minutes).totalMinutes).day;
}

export { applyAccept } from "../task-run/apply";

/** Debug helper. `amount` is final XP, not multiplied again. */
export function grantRawXp(
  state: CareerState,
  skillId: SkillId,
  amount: number,
  catalog: SimCatalog,
): ActionResult {
  const applied = grantToSkill(state, skillId, amount, catalog);
  return ok(applied.state, applied.events);
}

export function changeMoney(state: CareerState, delta: number): ActionResult {
  const money = applyMoney(state.players.money, delta);
  if (money === state.players.money) return ok(state, []);
  return ok(
    { ...state, players: { ...state.players, money } },
    [{ type: "moneyChanged", delta: money - state.players.money, money }],
  );
}

export function fillEnergy(state: CareerState, catalog: SimCatalog): ActionResult {
  const filled = setEnergy(state, catalog.config.energy_max, catalog.config.energy_max);
  return ok(filled.state, filled.events);
}

export function xpNeededForNextLevel(
  state: CareerState,
  skillId: SkillId,
  catalog: SimCatalog,
): number {
  const skill = skillById(state.player_skills, skillId);
  const need = catalog.skillLevelXp.find((row) => row.level === skill.level)?.xp_to_next ?? 0;
  if (need <= 0) return 0;
  return Math.max(0, need - skill.xp);
}
