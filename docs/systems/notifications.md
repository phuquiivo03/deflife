# Thông báo

Left column. Newest first. Empty copy stays “Chưa có thông báo.” **Đã đọc** still marks every row read. Clicking a row still marks that row read. An action still calls `runNoticeAction` and does nothing else.

Numbers live in `src/components/game/notifications.config.ts`.

## Unread badge

`ui_badge_unread_lg` (`public/ui/m5_1/`, native 16×16 and `_x2` 32×32). `slices.json` records the native size. The header draws the native sheet at 1×, so the disc is **16 CSS px**. The count is Galmuri7 at 8px, white, centered. Above 9 the disc still shows 9. The disc eases its opacity to `NOTICE_BADGE_PULSE_OPACITY` (0.75) over `NOTICE_BADGE_PULSE_MS` (1600). `prefers-reduced-motion` leaves it fully opaque.

## Rows

| | Before | Now |
|---|--------|-----|
| Card padding | 12px | `NOTICE_LIST.paddingPx` (8) |
| Icon / copy gap | 10px | `NOTICE_LIST.gapPx` (8) |
| List gap | 8px | `NOTICE_LIST.listGapPx` (6) |
| Row icon | 32px | `NOTICE_LIST.rowIconPx` (16, the native notice icon) |
| Message | Galmuri9 at 20px | Galmuri7 at `NOTICE_LIST.textPx` (16) |
| Lines | open | `NOTICE_LIST.lines` (2). A short notice stays on one line |

The clock sits on the first line, in the muted color, inside the same clamp.

## Actions

`PixelButton` variant `icon`. The face is the shared icon 9-slice at 2× (48 CSS px, center 16 CSS px). The glyph is the native `icon_action_*` (16×16), so it fills that center. Tooltip text and `aria-label` are the old button label. The tip is `src/components/ui/tooltip.tsx`.

| Action | Label | Glyph |
|--------|-------|-------|
| `payRent` | Trả trọ | `icon_action_pay_rent` (money stack) |
| `viewJobs` | Xem job | `icon_action_view_job` (ticket) |
| `openStore` | Mở store | `icon_action_open_store` (bag). Still `runNoticeAction("openStore")`, which opens the store modal |
| `eat` | Đi ăn | `icon_action_eat` (rice bowl) |
| `sleep` | Đi ngủ | `icon_action_sleep` (bed) |

The notice schema emits `payRent`, `viewJobs`, and `openStore` only. `eat` and `sleep` are in the same map so a later action id picks up the glyph without a new button. A label with no glyph uses the old outline text button and the same click.
