# Pixel buttons

Shared control for new chrome. Import `PixelButton` from `@/components/ui/button`. The existing `Button` (soft lavender / violet) is unchanged.

```tsx
import { PixelButton } from "@/components/ui/button";

<PixelButton variant="primary">Bắt đầu</PixelButton>
<PixelButton variant="secondary">Để sau</PixelButton>
<PixelButton variant="danger">Bỏ</PixelButton>
<PixelButton variant="icon" aria-label="Sức khỏe">{icon}</PixelButton>
```

## Skins

Art lives in `public/ui/m5_1/`, with the other M5.1 frames (`m51AssetPath`).

| | |
|---|---|
| Keys | `ui_btn_primary`, `ui_btn_secondary`, `ui_btn_danger`, `ui_btn_icon` |
| States | `normal`, `hover`, `pressed` |
| Files | `ui_btn_<variant>_<state>.png` (24×24) and `ui_btn_<variant>_<state>_x2.png` (48×48) |

`public/ui/m5_1/slices.json` → `ui_btn_*` is the 9-slice: native size 24, inset 8. The component draws at 2× and uses the `_x2` sheet, so the 8px inset is 16 CSS pixels and each art pixel stays one CSS pixel. Corners stay put; the center stretches.

Hover swaps to the hover sheet (brighter face). Press swaps to the pressed sheet.

## Press

The pressed sheet already draws the face 2 native pixels lower (`slices.json` note). The label and icon, which sit in the button, move by that same distance: 2 × the draw scale (4 CSS px at 2×). The button box does not move, so the face is not shifted twice. There is no extra offset on the text beyond the face shift.

Numbers that are not in the slice file (draw scale, padding, gap, focus ring, ink) live in `src/components/ui/button/config.ts`.

## Try it

Open `/debug/buttons`. Hold a button: the face art and the label drop together, then release back. Disabled buttons do not drop. Icon buttons are square.

## Sleep

The HUD **Đi ngủ** control is `SleepButton` (`src/components/game/SleepButton.tsx`): `PixelButton` variant `icon`, no text. The face is `icon_btn_sleep` (`icon_btn_sleep.png` 24×24, `icon_btn_sleep_x2.png` 48×48) drawn at 2× in the 9-slice center, so the button box is the icon plus the two slice borders.

`fx_zzz` plays above the top-right of that bed while sleep is allowed (Tối and Đêm). The sheet is `fx_zzz.png` (36×12) and `fx_zzz_x2.png` (72×24).

| | |
|---|---|
| Source | `public/ui/m5_1/anim.json` → `fx_zzz` |
| Frames | 12×12, 3 frames, horizontal |
| Loop | 900ms, looping |
| Motion | drift up `ZZZ_DRIFT_NATIVE_PX` (8 native px) and fade out |
| Anchor | `ZZZ_ANCHOR_NATIVE`: 5 native px past the bed's right, 7 native px above its top |
| Still | `prefers-reduced-motion`: first frame, no drift |

Those numbers are read in `src/components/game/sleep-button.config.ts`. The drift and the anchor are the only distances the art file does not give.

The tooltip is `src/components/ui/tooltip.tsx` with the text “Đi ngủ”. The button keeps `aria-label` “Đi ngủ”. A span around the button is the tooltip trigger, so the tip still opens when the control is disabled. Clicking still calls the same `sleep` action.

## Store

The HUD **Cửa hàng** control is `StoreButton` (`src/components/game/StoreButton.tsx`): `PixelButton` variant `icon`, no text. The face is `icon_btn_store` (`icon_btn_store.png` 24×24, `icon_btn_store_x2.png` 48×48) drawn at 2× in the 9-slice center, so the button box is the icon plus the two slice borders. The outer size is read in `src/components/game/store-button.config.ts`.

It sits on the HUD icon bar immediately before **Đi ngủ**. The gap is `HUD_ICON_GAP_PX` (8). The tooltip is the shared tooltip with the text “Cửa hàng”, and the button keeps that `aria-label`.

The list opens in the shared modal (`src/components/ui/modal.tsx`). The existing store cards, prices, and buy/pin actions are unchanged. Closing is Escape, a backdrop click, or **Đóng**. The notice action “Mở store” still sets `storeOpen`. The Thông báo panel no longer embeds the list.

## Meals

The rice bowl under the room is `HungerDock` in `src/components/game/FoodPopup.tsx`. The face is `icon_btn_food` drawn at 2× (`foodArtFile`). That graphic is the whole control. There is no hunger badge on the bowl.

The shared tooltip is `src/components/ui/tooltip.tsx`. The text is `foodHungerTip`: “Ăn · ” plus the level from `hungerLabel` (“No”, “Hơi đói”, “Đói”), for example “Ăn · Hơi đói”. The button `aria-label` uses that same string. The level word also sits beside the bowl.

The bowl icon pulses with opacity and brightness. It does not move. Numbers are `HUNGER_BOWL_BLINK` in `src/components/game/food-dock.config.ts`. The CSS module is `src/components/game/food-dock.module.css`.

| Level | Motion |
|---|---|
| No | Still. No animation, no tint. |
| Hơi đói | 2200ms. Opacity eases down to 0.78, brightness to 0.94. |
| Đói | 700ms. Opacity eases down to 0.45, brightness to 0.7. |

`prefers-reduced-motion` skips the pulse and holds a static tint: Hơi đói at opacity 0.9 and brightness 0.96, Đói at opacity 0.62 and brightness 0.78.

## Notice actions

Pay rent, view job, open store, eat, and sleep in the notice list use `PixelButton` variant `secondary`. The glyph (`icon_action_*`, 16×16 native) sits in the 16px center beside a Galmuri7 label: “Trả trọ”, “Xem job”, “Mở store”, “Ăn”, “Ngủ”. `aria-label` and the tooltip repeat that label. Sizes and the text-button fallback are in `src/components/game/notifications.config.ts`.
