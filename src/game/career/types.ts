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
  starting_money: number;
  starting_energy: number;
  starting_reputation: number;
  rank_brackets: RankBracket[];
};

export type PlayerRow = {
  id: string;
  stage: string;
  game_day: number;
  game_minute: number;
  money: number;
  energy: number;
  reputation: number;
  freelance_completed: number;
};

export type PlayerSkill = {
  skill_id: SkillId;
  level: number;
  xp: number;
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
  player_jobs: PlayerJob[];
  player_unlocks: PlayerUnlock[];
  player_events: PlayerEvent[];
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
