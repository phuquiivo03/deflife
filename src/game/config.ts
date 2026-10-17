export const WORLD = { w: 427, h: 240 } as const;
export const UNITS = "px@427x240";

export const MIN_VIEW_W = 200;
export const PORTRAIT_SCENE_MAX_H = 0.62;

export const DEFAULT_LETTERBOX = "#15111c";

export const CHAR_DOWNSCALE = 3.5;
export const CHAR_KEY = { r: 209, g: 17, b: 90 };
export const SIT_HIP_FROM_BOTTOM = 9;
export const FLOOR_SIT_OFFSET_Y = -4;

export const STAGES = ["student", "junior", "senior"] as const;
export type StageId = (typeof STAGES)[number];

export const PERSIST_KEY = "devlife:v1";
/**
 * v1: stage, loadouts, showCharacter.
 * v2: in-game `totalMinutes` (see docs/systems/time.md).
 * v3: career tables for knowledge + jobs (see docs/systems/knowledge.md).
 * v4: player_study_completions. Older saves have no course history, so none are completed.
 * v5: player_jobs.task_run. Older jobs have no in-progress CRT task.
 * v6: health, mood, and the life-sim day counters. Older saves gain the defaults.
 * v7: life feed (events, notices, diary). Older saves gain an empty feed.
 * v8: store ownership and the pinned item. Older saves own nothing and stay in the student room.
 * v9: notice `cue`. Older notices leave it null and keep the id and severity rules.
 */
export const PERSIST_VERSION = 9;

export const CHAR_POSE_SIT_BACK = "character/derived/char_sit_back";
export const ATLAS_URL = "/atlas/devlife.png";
export const ATLAS_JSON_URL = "/atlas/devlife.json";
