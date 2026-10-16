# Task run

Freelance **Nhận** opens a CRT terminal over the center column (`TaskRunOverlay`, tokens in `docs/design/TERMINAL.md`). Esc closes it and leaves the job `active`, so the board can say Tiếp tục. The room canvas size does not change.

Each run is about 30 seconds. Copy is Vietnamese. Technical words stay in English and have a tap/hover tooltip from `glossary`.

## Steps

1. **Ticket** (~5s). The client note shows pay, the 30s hạn chót, the skill, and difficulty. Three readings: one correct, one wrong (more bugs), one “hỏi lại khách” (no extra bugs, extra build time).
2. **Build** (~15s). An ASCII bar and a log run on their own. Around 40% the bar waits for `./lam-ky` (more time, fewer bugs) or `./lam-au` (less time, more bugs). A seeded random event may fire: khách đổi yêu cầu, mất mạng, or works on my machine. While the bar is up, `sfx_typing_loop` loops from its own file. `./lam-au` switches to `sfx_typing_loop_fast`. The loop stops when the bar finishes, the terminal closes (Esc, which leaves the job active), the task moves on, or the tab is hidden.
3. **Test** (~10s). Pixel bugs crawl on a code snippet. Tap to catch them. Any bug still loose when the timer ends is a fail. Bugs are red (`terminal-bug-red` in `docs/design/TERMINAL.md`, the only red inside the terminal). They come in three sizes from `bug_motion`: small is fastest and turns most often, large is slowest. Speed, glyph size, turn interval, and spawn weights live in `config/task_run.json`. The tap target stays at least 44px on every size. `prefers-reduced-motion` slows them and lengthens turns; they still move.
4. **Result.** Success pays the template (money, job XP, reputation, freelance count) and plays the existing money and job cues. The first fail offers `./retry`, which spends `retry_energy` and replays Test. The second fail pays nothing and subtracts `fail_reputation` (not below 0). Failure is a `[fail]` label and a minus number. It does not use red.

## Bug count

`bugCount` in `src/game/task-run/formula.ts`, tuned by `config/task_run.json` `bugs`:

`clamp(base + (difficulty - 1) * per_difficulty - floor((level - 1) / skill_step) + ticket + build + event, min, max)`

Wrong ticket and `./lam-au` add bugs. Asking the client does not. A higher skill level removes bugs.

## Events

Emitted on `gameBus` and stored in `player_events`:

`taskStarted`, `ticketChosen`, `buildChoice`, `randomEventFired`, `bugCaught`, `bugEscaped`, `taskSucceeded`, `taskFailed`, `taskRetried`.

Success also emits the existing `jobCompleted`, `moneyChanged`, and `skillXpGained` events so the current audio map plays `sfx_money_gain` and `sfx_job_complete`. `taskFailed` plays `sfx_job_failed`. `bugEscaped` plays `sfx_ui_locked_denied`. `randomEventFired` plays `sfx_ui_toast`. The typing loops are file cues (`loop: true`, volume 0.38) and stay out of the SFX sprite. Ogg loops the whole buffer. The mp3 fallback skips the leading encoder silence with `loopStart` / `loopEnd`.

## Save

`player_jobs.task_run` holds the step, seed, choices, bug counts, retries, and outcome. Persist version is 5. Older saves load with `task_run` null.
