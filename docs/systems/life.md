# Life sim (M5 phase 1)

Time slots, vitals, and bills. The spec is [docs/specs/M5_life_sim.md](../specs/M5_life_sim.md). Random events, the notification tab, the store, and personality are later phases. Sound keys are declared in `src/game/life/sounds.ts` and no-op until files exist. Placeholder art is `public/ui/m5/` under the spec's asset keys.

Numbers live in [config/life_sim.json](../../config/life_sim.json). Starting money stays in `config/game_config.json` (`3000000`).

## Calendar

Day 1 is Monday. A month is 28 days, a year is 12 months. One slot is 2 hours. A weekday budget is 10 slots from 06:00 (through 02:00). A weekend budget is 12 (through 06:00). The budget is captured at 06:00 so midnight does not change it.

Staying into a slot past that budget costs 4 health immediately and queues −5 mood for the next 06:00.

Dated holidays: Tết (month 1, days 1–3), 30/4 as the last day of month 4, 1/5 as month 5 day 1, Trung thu month 8 day 15, Black Friday month 11 day 26 (the 4th Friday when day 1 is Monday). Finals and salary review have no dates yet, so they are not on the calendar. Friday is flagged as a deploy day for a later event. None of these change stats in this phase except the Monday mood.

## Stats

Energy, health, and mood are floats from 0 to 100. The HUD rounds them. An action applies, in order: base, diminishing on a positive mood (`× 0.6^times today`, reset at 06:00), personality `× 1`, furniture `+ 0`, then a work-streak energy cost `× 1.2` when the streak is at least 3, then clamp, then thresholds. An event effect only adds and clamps.

Each waking slot: mood −1. If the work streak is at least 3, another −2.

End of the calendar day (midnight, or sleep if the player skipped midnight): fewer than 2 meals costs 5 health, exactly 3 meals restores 2. Mood moves 10% of the way toward 60. Three work days in a row with fewer than 2 fun slots costs 3 mood. A finished course or a finished job counts as work. This phase has no fun action, so fun slots stay 0.

Sleep of `h` hours: energy max is 70 while health is under 30, otherwise 100. Energy becomes `min(max, energy + 12.5h)`. Under 6 hours, health loses `4 × (6 − h)` and the next morning loses 5 mood.

Thresholds: energy under 15 blocks taking a job. Energy under an action's cost blocks it; **Cố làm** spends 5 health and does it anyway (not available under the 15 floor). Mood under 30 multiplies XP by 0.7 (floored) and adds 1 bug. Mood under 15 schedules a freelance lock for the next day. Health under 10 is a hospital stay: health returns to 10, money −1,000,000, the clock jumps 2 days to 06:00, and those skipped days do not run the meal check.

## Bills

Rent and utilities are due on day 1 of a month. Salary is paid on day 10: Junior 15,000,000, Senior 45,000,000 (the low end of the spec ranges). Student has no salary. The opening day does not emit `dayStarted`, so the first charge is the next month's day 1.

If rent does not clear, each day of that unpaid month costs 3 mood and increments the debt counter. Day 3 and day 7 of the debt are recorded for the later landlord events; this phase does not open those events. Utilities that do not clear are skipped. Paying a later month's rent clears the counter.

Food, from the character panel: mì 8,000 (health −3), cơm nhà 25,000, cơm tấm 35,000. Three meals a day. Freelance payout is `base × (1 + 0.1 × tier) × (0.8 + reputation / 250)`, rounded. `base` is the template pay.

## Save

Persist version 6. Older saves keep money and energy and gain health 70, mood 70, and empty life counters.
