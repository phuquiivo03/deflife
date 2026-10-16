-- Knowledge + Job system v1.
-- Static rows ship as JSON in config/. Player rows persist in localStorage
-- with this same shape so a later Supabase adapter can replace storage only.
-- `players.energy` is temporary until the stats system owns vitals.

CREATE TABLE skills (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL
);

CREATE TABLE skill_level_xp (
  level integer PRIMARY KEY CHECK (level BETWEEN 1 AND 10),
  xp_to_next integer NOT NULL CHECK (xp_to_next >= 0)
);

CREATE TABLE study_activities (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  hours integer NOT NULL CHECK (hours > 0),
  energy integer NOT NULL CHECK (energy >= 0),
  skill_id text NOT NULL REFERENCES skills (id),
  -- false: the player can complete this course only once.
  repeatable boolean NOT NULL DEFAULT false
);

CREATE TABLE study_activity_xp (
  activity_id text NOT NULL REFERENCES study_activities (id),
  skill_id text NOT NULL REFERENCES skills (id),
  xp integer NOT NULL CHECK (xp >= 0),
  PRIMARY KEY (activity_id, skill_id)
);

CREATE TABLE job_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('freelance', 'remote')),
  tier integer NOT NULL CHECK (tier >= 1),
  hours integer NOT NULL CHECK (hours >= 0),
  deadline_days integer NOT NULL CHECK (deadline_days >= 0),
  pay integer NOT NULL CHECK (pay >= 0),
  salary integer CHECK (salary IS NULL OR salary >= 0),
  reputation_gain integer NOT NULL CHECK (reputation_gain >= 0),
  min_reputation integer NOT NULL CHECK (min_reputation >= 0),
  unlock_freelance_completed integer NOT NULL CHECK (unlock_freelance_completed >= 0),
  -- Per-task energy cost. The spec requires an energy check; the column is
  -- named here because the listed template fields did not include it.
  energy integer NOT NULL CHECK (energy >= 0)
);

CREATE TABLE job_template_requirements (
  template_id text NOT NULL REFERENCES job_templates (id),
  skill_id text NOT NULL REFERENCES skills (id),
  min_level integer NOT NULL CHECK (min_level BETWEEN 1 AND 10),
  PRIMARY KEY (template_id, skill_id)
);

CREATE TABLE job_template_xp (
  template_id text NOT NULL REFERENCES job_templates (id),
  skill_id text NOT NULL REFERENCES skills (id),
  xp integer NOT NULL CHECK (xp >= 0),
  PRIMARY KEY (template_id, skill_id)
);

CREATE TABLE career_milestones (
  id text PRIMARY KEY,
  freelance_completed integer NOT NULL CHECK (freelance_completed > 0),
  label text NOT NULL
);

-- One row per key. Rank brackets are the jsonb value of `rank_brackets`.
CREATE TABLE game_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE players (
  id text PRIMARY KEY,
  stage text NOT NULL,
  game_day integer NOT NULL CHECK (game_day >= 1),
  game_minute integer NOT NULL CHECK (game_minute BETWEEN 0 AND 1439),
  money integer NOT NULL,
  energy integer NOT NULL CHECK (energy BETWEEN 0 AND 100),
  reputation integer NOT NULL CHECK (reputation >= 0),
  freelance_completed integer NOT NULL CHECK (freelance_completed >= 0)
);

CREATE TABLE player_skills (
  player_id text NOT NULL REFERENCES players (id),
  skill_id text NOT NULL REFERENCES skills (id),
  level integer NOT NULL CHECK (level BETWEEN 1 AND 10),
  xp integer NOT NULL CHECK (xp >= 0),
  PRIMARY KEY (player_id, skill_id)
);

-- Local saves omit player_id. No row means the course has not been completed.
CREATE TABLE player_study_completions (
  player_id text NOT NULL REFERENCES players (id),
  activity_id text NOT NULL REFERENCES study_activities (id),
  skill_id text NOT NULL REFERENCES skills (id),
  xp_gained integer NOT NULL CHECK (xp_gained >= 0),
  completed_day integer NOT NULL CHECK (completed_day >= 1),
  PRIMARY KEY (player_id, activity_id)
);

CREATE TABLE player_jobs (
  id text PRIMARY KEY,
  player_id text NOT NULL REFERENCES players (id),
  template_id text NOT NULL REFERENCES job_templates (id),
  job_type text NOT NULL CHECK (job_type IN ('freelance', 'remote')),
  status text NOT NULL CHECK (
    status IN ('offered', 'active', 'completed', 'failed', 'expired', 'quit', 'fired')
  ),
  hours_required integer NOT NULL CHECK (hours_required >= 0),
  progress_hours integer NOT NULL CHECK (progress_hours >= 0),
  bugs integer NOT NULL CHECK (bugs >= 0),
  pay integer NOT NULL CHECK (pay >= 0),
  offered_day integer NOT NULL CHECK (offered_day >= 1),
  accepted_day integer,
  deadline_day integer,
  finished_day integer,
  missed_days integer NOT NULL CHECK (missed_days >= 0),
  -- CRT task snapshot. Null while the job is only offered.
  task_run jsonb
);

CREATE TABLE player_unlocks (
  player_id text NOT NULL REFERENCES players (id),
  milestone_id text NOT NULL REFERENCES career_milestones (id),
  reached_day integer NOT NULL CHECK (reached_day >= 1),
  PRIMARY KEY (player_id, milestone_id)
);

CREATE TABLE player_events (
  id text PRIMARY KEY,
  player_id text NOT NULL REFERENCES players (id),
  type text NOT NULL,
  day integer NOT NULL CHECK (day >= 1),
  payload jsonb NOT NULL
);
