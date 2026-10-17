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

The tooltip is the `title` and `aria-label` “Đi ngủ”. A span around the button keeps the title when the control is disabled. Clicking still calls the same `sleep` action.
