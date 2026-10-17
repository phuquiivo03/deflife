# Life sim (M5)

Time slots, vitals, bills, small events, the Thông báo panel, and the store. The spec is [docs/specs/M5_life_sim.md](../specs/M5_life_sim.md). Personality is the next phase. Trait icons in `public/ui/m5/` stay placeholders. The other M5 art there is the approved native PNG, including store furniture placed from `src/game/life/placement.json`. The life-sim one-shots are in the SFX sprite. One moment plays one life cue. A specific cue replaces the severity ping, and the same cue fired twice in one tick plays once. A choice or a buff plays `sfx_event_open`. Salary plays `sfx_salary`. The sick threshold plays `sfx_sick_cough`. The day-7 landlord knock plays `sfx_landlord_knock`. The important-day banner shares that same tick and plays `sfx_event_open`. Sleep plays `sfx_diary_flip`. A successful purchase plays `sfx_store_buy` and the existing money-spend cue.

Numbers live in [config/life_sim.json](../../config/life_sim.json) and [config/store.json](../../config/store.json). Starting money stays in `config/game_config.json` (`3000000`).

## Calendar

Day 1 is Monday. A month is 28 days, a year is 12 months. One slot is 2 hours. A weekday budget is 10 slots from 06:00 (through 02:00). A weekend budget is 12 (through 06:00). The budget is captured at 06:00 so midnight does not change it.

Staying into a slot past that budget costs 4 health immediately and queues −5 mood for the next 06:00.

Dated holidays: Tết (month 1, days 1–3), 30/4 as the last day of month 4, 1/5 as month 5 day 1, Trung thu month 8 day 15, Black Friday month 11 day 26 (the 4th Friday when day 1 is Monday). Finals and salary review have no dates yet, so they are not on the calendar. Friday is a deploy day, used by the hackathon. Holiday banners do not change stats. Monday still costs the morning mood.

## Stats

Energy, health, and mood are floats from 0 to 100. The HUD rounds them. An action applies, in order: base, diminishing on a positive mood (`× 0.6^times today`, reset at 06:00), personality `× 1`, furniture, then a work-streak energy cost `× 1.2` when the streak is at least 3, then clamp, then thresholds. An event effect only adds and clamps. At most 3 furniture contributions apply to one stat; the largest are kept.

Each waking slot: mood −1. If the work streak is at least 3, another −2.

End of the calendar day (midnight, or sleep if the player skipped midnight): fewer than 2 meals costs 5 health, exactly 3 meals restores 2. Owned furniture then adds its daily health and mood. Mood moves 10% of the way toward 60. Three work days in a row with fewer than 2 fun slots costs 3 mood. A finished course or a finished job counts as work. This phase has no fun action, so fun slots stay 0.

Sleep of `h` hours: energy max is 70 while health is under 30, otherwise 100. Energy becomes `min(max, energy + 12.5h + sleep bonus)`. Under 6 hours, health loses `4 × (6 − h)` and the next morning loses 5 mood.

Thresholds: energy under 15 blocks taking a job. Energy under an action's cost blocks it; **Cố làm** spends 5 health and does it anyway (not available under the 15 floor). Mood under 30 multiplies XP by 0.7 (floored) and adds 1 bug. Mood under 15 schedules a freelance lock for the next day. Health under 10 is a hospital stay: health returns to 10, money −1,000,000, the clock jumps 2 days to 06:00, and those skipped days do not run the meal check.

## Bills

Rent and utilities are due on day 1 of a month. Salary is paid on day 10: Junior 15,000,000, Senior 45,000,000 (the low end of the spec ranges). Student has no salary. The opening day does not emit `dayStarted`, so the first charge is the next month's day 1.

If rent does not clear, each day of that unpaid month costs 3 mood and increments the debt counter. Debt day 3 opens “Chủ trọ nhắc khéo tiền nhà.” Debt day 7 opens “Chủ trọ gõ cửa.” Those two dialogs do not use the daily small-event slot and do not reset pity. **Trả trọ** pays the outstanding rent when the player can afford it; otherwise the dialog stays open. Utilities that do not clear are skipped. Paying a later month's rent clears the counter.

Food, from the character panel: mì 8,000 (health −3), cơm nhà 25,000, cơm tấm 35,000. Three meals a day. Freelance payout is `base × (1 + 0.1 × tier) × (0.8 + reputation / 250)`, rounded. `base` is the template pay.

## Events

One small event can fire per day, at the end of a slot from 10:00 onward. Chance is `0.12 + min(pity, 3) × 0.05`. An empty day adds 1 pity, capped at 3. A fired event resets pity to 0 and cools that event down for 5 days. Mood under 30 multiplies a good event's weight by 1.5. Effects add and clamp. Event XP uses the same mood ×0.7 floor as job XP. A lost slot jumps the clock 2 hours without another roll. While the task terminal is open, the roll waits and flushes when the terminal closes.

Choice copy is the one-line spec text. Đồ án is student only. Prod, họp, headhunter, and đồng nghiệp are junior and senior. Karaoke and mất điện are evening and night. Hackathon is Friday only and resolves the Monday after: win chance `0.10 + 0.03 × max skill level`, prize 20,000,000 and 200 XP on the highest skill. “Mở store” opens the cửa hàng.

## Store

Rooms and furniture are bought from **Cửa hàng** on the Thông báo panel. Junior is 25,000,000 and needs one skill at level 3 plus 30 reputation. Senior is 180,000,000 and needs two skills at level 8. The header, the 1/2/3 keys, and `?stage=` stay on a room until it is bought. Student is the start and stays available. Buying a room moves the player there. Rent, utilities, and salary follow that room.

A room's sleep, mood, and health bonuses apply only while the player lives in it. A bought item's bonus applies in every room. The plant is +2 mood a day. The fan and air conditioner add 5 and 10 sleep energy. The mattress is +1 health a day. The ergo chair multiplies job accept and retry energy by 0.9 before the work streak. The second monitor multiplies study and job XP by 1.1, floored, before the mood multiplier, and it stays locked until the Junior room is owned. Event XP is unchanged.

Black Friday multiplies prices by 0.9. One pinned item shows `label percent%` on the sleep diary, using that day's price. When money covers the pin, one notice says “Đủ tiền …”. Floor sprites replace `student.mattress`, `junior.office_chair`, and `junior.bed` and draw their shadow under the placement anchor. `item_mattress.png` is not used.

## Thông báo and UX

The left column is the notice list, newest first. Unread rows show `ui_badge_unread.png`. Empty copy is “Chưa có thông báo.” A new row plays `sfx_notif_info`, `sfx_notif_warn`, or `sfx_notif_urgent`, unless that row carries a specific cue. Payday plays `sfx_salary`. Health under 30 plays `sfx_sick_cough` once. The day-7 landlord plays `sfx_landlord_knock`. A choice or a buff plays only `sfx_event_open` for that moment. Warn and urgent lines also print `> WARN:` in the task terminal. Stat changes float on the HUD bars. Health under 30, mood under 15, and energy under 15 blink, and the room shows cough, cloud, or sweat. A holiday banner uses `ui_banner.png` for 2 seconds and plays `sfx_event_open` as part of the same moment as that morning's notices. Sleep opens the diary (`sfx_diary_flip`) against the morning snapshot, then the snapshot is recaptured.

## Save

Persist version 8. Older saves keep money and energy and gain health 70, mood 70, empty life counters, and an empty event feed. A save from before the store owns nothing and wakes in the student room.
