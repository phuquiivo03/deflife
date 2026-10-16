import type { SkillId, TaskTicketChoice } from "../career/types";

export type { TaskBuildChoice, TaskOutcome, TaskRun, TaskStep, TaskTicketChoice } from "../career/types";

export type BugFormula = {
  base: number;
  per_difficulty: number;
  skill_step: number;
  wrong_ticket: number;
  ask_ticket: number;
  correct_ticket: number;
  careful: number;
  rushed: number;
  min: number;
  max: number;
};

export type TaskEventDef = {
  id: string;
  name: string;
  log: string;
  bug_delta: number;
  time_delta_sec: number;
};

export type TaskChoice = {
  id: TaskTicketChoice;
  label: string;
};

export type TaskTicket = {
  id: string;
  skill_id: SkillId;
  title: string;
  quote: string;
  difficulty: number;
  difficulty_label: string;
  prompt: string;
  choices: TaskChoice[];
};

export type TaskRunConfig = {
  ticket_sec: number;
  build_sec: number;
  test_sec: number;
  choice_at: number;
  ask_extra_sec: number;
  careful_extra_sec: number;
  rushed_extra_sec: number;
  retry_energy: number;
  max_retries: number;
  fail_reputation: number;
  event_chance: number;
  bugs: BugFormula;
  events: TaskEventDef[];
  build_logs: string[];
  test_code: string[];
  glossary: Record<string, string>;
  tickets: TaskTicket[];
};
