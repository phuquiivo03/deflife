# Jobs

Freelance tasks for v1. Remote templates are in `config/job_templates.json` and are not offered yet. Hours, bugs, deadline, and pay are still stored on `player_jobs`.

## Board

On each `dayStarted`, offers still open from earlier days become `expired`. The day then gets `board_size` new `offered` rows (4 in `game_config`) when that day has none yet. That refresh does not change energy. Energy returns to `energyOnSleep` only on `sleep`, which the clock emits after `dayStarted`.

Day 1 does not emit `dayStarted` (the clock starts at 08:00). After hydration the same generator runs once if today has no board.

The sample is a day-seeded shuffle of **freelance** templates only. The same day is stable. When the pool contains both a template the player can take and one they cannot, the sample keeps at least one of each so the board can show a locked card beside an open one. Completed cards from today stay on the board and fade. Expired rows stay in `player_jobs` and leave the board.

## Nhận

Nhận opens the CRT task run (`docs/systems/task-run.md`) instead of paying immediately. The job becomes `active`, energy drops by the template cost, and `task_run` stores the step. Money, XP, reputation, and `freelance_completed` land only when the test step catches every bug. A final fail pays nothing and lowers reputation. `bugs` on a finished job is how many bugs escaped (0 on success).

A locked card shows `icon_task_locked` and the missing lines (skill level, uy tín, năng lượng, freelance count). Its button shakes on click and does not grant the reward. An `active` card stays on the board as Tiếp tục.

## Milestones

`config/career_milestones.json`: 10, 30, 60, and 100 freelance. The first time `freelance_completed` reaches a threshold, `player_unlocks` gains that id and `milestoneReached` fires. The skill screen shows freelance done over the highest threshold (100).

## Save

`devlife:v1` version 5. The career document uses the table names in [`docs/db/schema.sql`](../db/schema.sql). `StorageAdapter` (`load` / `save` / `remove`) is what Zustand persist calls. v1 implements `LocalStorageAdapter`.

Versions before 3 keep `stage`, loadouts, `showCharacter`, and the clock (`totalMinutes` from version 2, or 08:00 day 1 from version 1) and receive a fresh career. Version 3 keeps skills, jobs, unlocks, and the event log. Version 4 adds course history. Version 5 adds `player_jobs.task_run` (null on older jobs).

`players.energy` is a temporary column until the stats system replaces `src/game/vitals`. Child rows in the save omit `player_id` because the document is already one player; the SQL tables include `player_id` so a later database can store many players. The local row id is `local`.

Health and mood on the HUD stay on the stub. Energy and money come from this save.
