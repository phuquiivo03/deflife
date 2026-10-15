# Knowledge

Study, skill XP, and ranks. Numbers live in `config/`. The clock stays on [`time.md`](time.md). Skill and job facts travel on `gameBus` (`src/game/events/bus.ts`), not on the closed `TimeEvent` union.

## Skills

Five skills: `frontend`, `backend`, `database`, `devops`, `soft`. Levels are 1–10. `config/skill_level_xp.json` is the XP required to leave that level. Level 10 has `xp_to_next` 0 and discards further XP.

## Multipliers

`config/game_config.json`:

- `study_cap_level` is 6.
- Below 6, study grants 100% and jobs grant 30%.
- At 6 and above, study grants 10% and jobs grant 100%.

The multiplier is chosen from the level **before** the grant. One course or task does not change multiplier halfway through its own XP. Granted XP is `floor(base * multiplier)`. A fraction below 1 grants 0.

## Ranks

Brackets are `rank_brackets` in `game_config`: 1–2 Intern, 3–4 Junior, 5–7 Middle, 8–10 Senior.

The label `Frontend: Junior 60%` is progress **inside that bracket**:

`(level - min + step) / (max - min + 1)`

`step` is `xp / xp_to_next`. A level with `xp_to_next` 0 counts as a full step, so level 10 is Senior 100%.

The bar on the skill screen is progress to the **next level**, not the bracket percent.

## Courses

`config/study_activities.json` and `config/study_activity_xp.json`. Buying a course spends money and energy, adds XP immediately, then fast-forwards the clock by exactly `hours * 60` through `advanceMinutes`. The returned time events are emitted on `timeBus`, so a course that crosses midnight still starts the next day.

The button stays clickable when the course is blocked so it can shake. The reason is `Không đủ tiền`, `Không đủ năng lượng`, or both. The native `disabled` attribute is not used, because it would swallow the click.

## Energy

Energy is not a stats-system stat yet. It lives on the player row (0–`energy_max`) in `src/game/vitals`. Only the `sleep` event changes it back up. `dayStarted` refreshes the job board and leaves energy where it is, including when a course fast-forward crosses midnight.

Sleep emits `dayStarted` and then `sleep`. The day handler runs first and does not refill. The sleep handler then sets energy to `energyOnSleep` from `game_config` (100, the same as full). The value is clamped to `energy_max`. A later stats system can replace `energyOnSleep` with a number computed from how long the player slept. The debug “Đầy năng lượng” control still sets energy to `energy_max`.

Starting money, energy, and reputation are `starting_money`, `starting_energy`, and `starting_reputation` in `game_config` (1.500.000đ, 70, 0) so the first screen can show both an affordable course and a locked one.

## Events

`skillXpGained`, `skillLevelUp`, `studyCompleted`, `moneyChanged`, `energyChanged`. Each one is also appended to `player_events`.
