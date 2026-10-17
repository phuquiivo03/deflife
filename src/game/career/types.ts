export const SKILL_IDS = ["frontend", "backend", "database", "devops", "soft"] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export type JobType = "freelance" | "remote";

export type JobStatus =
  | "offered"
  | "active"
  | "completed"
  | "failed"
  | "expired"
  | "quit"
  | "fired";

export type XpSource = "study" | "job";

export type SkillDef = {
  id: SkillId;
  name: string;
  icon: string;
};

export type SkillLevelXp = {
  level: number;
  xp_to_next: number;
};

export type StudyActivity = {
  id: string;
  name: string;
  icon: string;
  price: number;
  hours: number;
  energy: number;
  skill_id: SkillId;
  /** When false, the player can finish this course only once. */
  repeatable: boolean;
};

export type StudyActivityXp = {
  activity_id: string;
  skill_id: SkillId;
  xp: number;
};

export type JobTemplate = {
  id: string;
  name: string;
  job_type: JobType;
  tier: number;
  hours: number;
  deadline_days: number;
  pay: number;
  salary: number | null;
  reputation_gain: number;
  min_reputation: number;
  unlock_freelance_completed: number;
  energy: number;
};

export type JobTemplateRequirement = {
  template_id: string;
  skill_id: SkillId;
  min_level: number;
};

export type JobTemplateXp = {
  template_id: string;
  skill_id: SkillId;
  xp: number;
};

export type CareerMilestone = {
  id: string;
  freelance_completed: number;
  label: string;
};

export type RankBracket = {
  id: string;
  label: string;
  min_level: number;
  max_level: number;
};

export type GameConfig = {
  study_cap_level: number;
  study_xp_multiplier_below: number;
  study_xp_multiplier_at_cap: number;
  job_xp_multiplier_below: number;
  job_xp_multiplier_at_cap: number;
  board_size: number;
  energy_max: number;
  /** Energy set when the player sleeps. The stats system can replace this with a value from hours slept. */
  energyOnSleep: number;
  starting_money: number;
  starting_energy: number;
  starting_reputation: number;
  /** Default music bus gain, 0–1. Players can override it from the HUD. */
  audio_music_volume: number;
  /** Default SFX bus gain, 0–1. */
  audio_sfx_volume: number;
  rank_brackets: RankBracket[];
};

export type PlayerRow = {
  id: string;
  stage: string;
  game_day: number;
  game_minute: number;
  money: number;
  /** 0–100 float. The HUD rounds. */
  energy: number;
  /** 0–100 float. Sức khỏe. The HUD rounds. */
  health: number;
  /** 0–100 float. The HUD rounds. */
  mood: number;
  reputation: number;
  freelance_completed: number;
};

/** Counters for the life-sim day. Personality and furniture stay neutral until later phases. */
export type LifeState = {
  mealsToday: number;
  positiveMoodApplies: number;
  workStreak: number;
  workedToday: boolean;
  funSlotsToday: number;
  lateSlotsToday: number;
  /** Mood subtracted at the next 06:00. Late slots and short sleep add to this. */
  moodPenaltyTomorrow: number;
  rentDebtDays: number;
  rentIssuedKey: string | null;
  paidRentKey: string | null;
  paidUtilitiesKey: string | null;
  paidSalaryKey: string | null;
  /** Freelance is locked when `game_day` equals this. */
  burnoutDay: number | null;
  lastEndedDay: number | null;
  /** Calendar bills and weekday flavor already ran for this game day. */
  settledDay: number | null;
  morningResolvedDay: number | null;
  /** Slot budget captured at the last 06:00, so a midnight rollover does not change it. */
  wakeBudget: number;
  /** Skip meal/streak end-of-day while the clock is inside a hospital jump. */
  suppressEndOfDayUntil: number | null;
};

export type PlayerSkill = {
  skill_id: SkillId;
  level: number;
  xp: number;
};

/** One finish per course. Local rows omit player_id. */
export type PlayerStudyCompletion = {
  activity_id: string;
  skill_id: SkillId;
  xp_gained: number;
  completed_day: number;
};

export type TaskTicketChoice = "correct" | "wrong" | "ask";
export type TaskBuildChoice = "careful" | "rushed";
export type TaskStep = "ticket" | "build" | "test" | "result";
export type TaskOutcome = "success" | "fail";

/** CRT task snapshot. Null while the job is only an offer. */
export type TaskRun = {
  step: TaskStep;
  seed: number;
  ticket: TaskTicketChoice | null;
  build: TaskBuildChoice | null;
  event_id: string | null;
  bugs_total: number;
  bugs_caught: number;
  retries: number;
  outcome: TaskOutcome | null;
  time_bonus_sec: number;
};

export type PlayerJob = {
  id: string;
  template_id: string;
  job_type: JobType;
  status: JobStatus;
  hours_required: number;
  progress_hours: number;
  bugs: number;
  pay: number;
  offered_day: number;
  accepted_day: number | null;
  deadline_day: number | null;
  finished_day: number | null;
  missed_days: number;
  task_run: TaskRun | null;
};

export type PlayerUnlock = {
  milestone_id: string;
  reached_day: number;
};

export type PlayerEvent = {
  id: string;
  type: string;
  day: number;
  payload: Record<string, unknown>;
};

/** localStorage document. Keys match the Postgres tables. */
export type CareerState = {
  players: PlayerRow;
  player_skills: PlayerSkill[];
  player_study_completions: PlayerStudyCompletion[];
  player_jobs: PlayerJob[];
  player_unlocks: PlayerUnlock[];
  player_events: PlayerEvent[];
  life: LifeState;
};

export type SimCatalog = {
  config: GameConfig;
  skills: SkillDef[];
  skillLevelXp: SkillLevelXp[];
  studyActivities: StudyActivity[];
  studyActivityXp: StudyActivityXp[];
  jobTemplates: JobTemplate[];
  jobTemplateRequirements: JobTemplateRequirement[];
  jobTemplateXp: JobTemplateXp[];
  milestones: CareerMilestone[];
};

export const LOCAL_PLAYER_ID = "local";
