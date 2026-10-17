import type { SkillId, TaskTicketChoice } from "../career/types";

export type { TaskBuildChoice, TaskOutcome, TaskRun, TaskStep, TaskTicketChoice } from "../career/types";

export type BugSizeId = "small" | "medium" | "large";

export type BugSizeSpec = {
  /** Visual glyph size in CSS pixels. The tap target stays `hit_px`. */
  px: number;
  /** Percent of the code area traveled per second. */
  speed: number;
  /** Milliseconds between random direction changes. */
  turn_ms: number;
  /** Relative spawn weight. Weights are normalized. */
  weight: number;
};

export type BugMotionConfig = {
  hit_px: number;
  /** Multiplies speed and lengthens the turn interval while reduced motion is on. */
  reduced_motion_scale: number;
  /** Percent inset so a bug bounces before it leaves the code area. */
  inset: number;
  sizes: Record<BugSizeId, BugSizeSpec>;
};

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
  /** Client changed the requirements. Prints a yellow WARNING line. */
  warning: boolean;
  bug_delta: number;
  time_delta_sec: number;
};

export type BugBody = {
  size: BugSizeId;
  /** Percent across the code area. */
  x: number;
  /** Percent down the code area. */
  y: number;
  /** Radians. 0 travels to the right. */
  angle: number;
  /** Milliseconds until the next random turn. */
  untilTurn: number;
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
  error_text: string;
  terminal_warn_blinks: number;
  terminal_error_blinks: number;
  terminal_blink_ms: number;
  terminal_shake_ms: number;
  bugs: BugFormula;
  bug_motion: BugMotionConfig;
  events: TaskEventDef[];
  build_logs: string[];
  test_code: string[];
  glossary: Record<string, string>;
  tickets: TaskTicket[];
};
