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
