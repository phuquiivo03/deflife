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

Energy is not a stats-system stat yet. It lives on the player row (0–`energy_max`) in `src/game/vitals`. `dayStarted` and `sleep` both refill it to full. Sleep already emits `dayStarted` before `sleep`, so the second refill is a no-op. A course that crosses midnight is deducted first and then refilled by `dayStarted`. That matches “refill on `dayStarted`”.

Starting money, energy, and reputation are `starting_money`, `starting_energy`, and `starting_reputation` in `game_config` (1.500.000đ, 70, 0) so the first screen can show both an affordable course and a locked one.

## Events

`skillXpGained`, `skillLevelUp`, `studyCompleted`, `moneyChanged`, `energyChanged`. Each one is also appended to `player_events`.
