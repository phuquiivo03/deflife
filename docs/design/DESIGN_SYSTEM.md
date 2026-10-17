# devlife UI — PRIMARY design system (Galmuri / soft gradient)

**This is the PRIMARY design system for devlife.** All UI in this repository must follow it unless the owner explicitly names another style for a feature (for example, the in-game terminal uses [TERMINAL.md](./TERMINAL.md)).

---

## Philosophy

Cozy developer life-sim chrome: soft blue–violet–pink atmosphere, readable lavender cards, pixel art for world assets (room, icons, avatars). The **room canvas stays small** in the center column — never upscale it to fill the layout.

---

## Background

Prefer **CSS** for crisp scaling:

- Gradient: `linear-gradient(135deg, #3B3F8F 0%, #5A63C4 45%, #9A78CC 75%, #D08FCB 100%)`
- Grid: `1px` lines `rgba(255,255,255,0.06)` every **24px**, fixed attachment
- Radial glow behind the room stage (`.room-stage-glow`)
- Reference/fallback image: `public/reference/background.jpg`

Utility class: `devlife-page-bg` on `html`/`body` (gradient + grid in **one** `background-image` stack — do not split into two classes or the grid layer hides the gradient).

**No black letterbox void** — use violet frame + gradient in empty space.

---

## Layout (desktop)

On `lg` and up, the three columns are one centered group (`max-w-[1200px]`), not stretched to the viewport. Side columns are **320px**. The center column holds the capped room and the HUD and stays within **520px**. A **20px** gap separates the columns. Leftover width on both sides is only the page gradient. The columns are top-aligned and share one row height, so the side panels match the center column. At 1366px the group still fits with those widths and the same gap. Below `lg`, the stack is unchanged.

| Column | Content |
|--------|---------|
| Left | Notifications (`Thông báo`) |
| Center | Small framed room, stage pill label, HUD card |
| Right | Tabs `Nhân vật` / `Sửa phòng` |

**Mobile:** stack **room → HUD → panels** (notifications, then character/customize).

---

## Color tokens

| Token | Value | Use |
|-------|-------|-----|
| panel bg | `#F3F1F8` | Cards |
| panel border | `#D9D4E6` | 1px borders |
| foreground | `#2A2548` | Text |
| muted foreground | `#5C5678` | Secondary text |
| coral | `#F0625F` | Health, Frontend bars |
| mint | `#5CCB9A` | Mood, Backend, EXP |
| sky | `#4A90E2` | Energy, Thuật toán |
| tab lavender | `#E8E2F4` | Inactive tabs |
| stage plate | `#E9E4F5` / `#3B3466` | Chamfered room label text/bg |

Shadow: `0 8px 24px rgba(30, 20, 80, 0.25)` (`shadow-panel` / `--shadow-panel`).

Radius: **12px** on cards (`--radius-panel`).

---

## Typography — Galmuri (OFL)

Self-hosted under `src/app/fonts/` (see `LICENSE.txt` in `public/fonts/`). **Do not use Galmuri11-Bold** (missing Vietnamese glyphs).

| Role | Face | Design size | Desktop UI (integer multiple) |
|------|------|-------------|-------------------------------|
| Body | Galmuri9 | 10px | 20px (`--text-galmuri-body`) |
| Titles | Galmuri11 | 12px | 24px (`--text-galmuri-title`) |
| Small | Galmuri7 | 8px | 16px (`--text-galmuri-small`) |

**Rule:** render at **integer px sizes** only (multiples of the design sizes for readability).

Classes: `font-galmuri-7`, `font-galmuri-9`, `font-galmuri-11`, `text-galmuri-*`.

User-facing copy: **Vietnamese**; tech terms stay English (Frontend, Backend, Junior, …).

---

## Pixel buttons

New chrome uses `PixelButton` from `@/components/ui/button` (`primary`, `secondary`, `danger`, and square `icon`). Skins are the `ui_btn_*` 9-slices in `public/ui/m5_1/` (`normal` / `hover` / `pressed`, native and `_x2`). Insets come from `slices.json`. The pressed face is already 2 native pixels lower; the label drops that same distance with the face. The older `Button` styles stay as they are. Details: [buttons.md](../systems/buttons.md).

---

## Pixel art

Room canvas, UI icons, avatars: `image-rendering: pixelated` (`.pixelated`). Do not blur or round canvas pixels.

### Icons (`public/ui/icons/`)

Art-agent PNGs with clean alpha (no chroma-key). Naming: `icon_<name>.png` and `icon_<name>_x4.png`.

| Asset | Native size | ×4 size |
|-------|-------------|---------|
| Icons | **44×44** | **176×176** |

**IDs (23):** `health`, `mood`, `energy`, `burnout`, `clock`, `level`, `job`, `reputation`, `stars`, `relationship`, `frontend`, `backend`, `devops`, `algorithms`, `english`, `communication`, `balance`, `salary`, `rent`, `food`, `savings`, `debt`, `skill_up`.

**HUD menu:** `skills` is `icon_skills.png` only (44×44, no `_x4`). The Kỹ năng button picks it through `SKILL_MENU_ICON`.

**Phase clock:** `morning`, `noon`, `evening`, `night` (same `icon_<key>.png` / `_x4` files). The HUD uses them next to the in-game clock and falls back to an emoji only when a file is missing.

Use `PixelIcon` + `resolveIconAsset()` in `src/lib/pixel-assets.ts`: pick native or `_x4` so CSS display size is an **integer downscale/upscale** only (e.g. 22px display → 44px native @ 2×, 88px display → 176px `_x4` @ 2×).

### Avatars (`public/ui/avatars/`)

Framed portraits for in-game chrome (use **framed**, not `_bust`, unless a scene explicitly needs bust crop).

| Asset | Native | ×4 |
|-------|--------|-----|
| Framed avatar | **48×48** | **192×192** |

**Roles:** `player`, `boss`, `tech_lead`, `coworker_male`, `designer`, `partner`, `hr`.  
Also shipped: `avatar_<role>_bust.png` (+ `_x4`) for future dialogue UI.

Use `PixelAvatar` + `resolveAvatarAsset()` with the same integer-scale rule.

---

## HUD & stat bars

- HUD card under the room has **no avatar**. Three labeled bars, each with `current/max`: **Sức khỏe** (coral), **Tinh thần** (mint), **Năng lượng** (sky). The numbers are rounded; the saved values are floats. Energy, health, mood, money, and the clock are the career/life state. The name on the character card stays the placeholder.
- Same card: money chip, `Ngày` + clock + phase icon, then the icon bar. **Cửa hàng** is `icon_btn_store` (no text, tooltip “Cửa hàng”) and sits beside an icon-only **Đi ngủ** (bed `icon_btn_sleep`, no text, tooltip “Đi ngủ”). Both tips use `src/components/ui/tooltip.tsx`. The sleep button keeps its `aria-label`. While sleep is allowed, `fx_zzz` floats above the bed; `prefers-reduced-motion` keeps the first frame still. Timings are in `src/components/game/sleep-button.config.ts` and `src/components/game/store-button.config.ts`. Then **Học** / **Việc làm** / **Kỹ năng**. The Kỹ năng icon is `icon_skills.png`, chosen by `SKILL_MENU_ICON` in `PlayerHudCard.tsx`.
- Audio row on that card: mute button (**Tắt tiếng** / **Bật tiếng**) and two sliders, **Nhạc** and **Hiệu ứng**. Mute uses `icon_sound_on` / `icon_sound_off` (44×44 native only, shown at 22px, `image-rendering: pixelated`). Each slider puts `icon_volume_low` and `icon_volume_high` at its ends the same way. Defaults live in `game_config.json`: sound on, Nhạc 0.5, Hiệu ứng 0.8. The choice is stored in `localStorage` (`devlife:audio:v2`), separate from the career save. A `devlife:audio:v1` payload is unmuted once and rewritten as v2; a later mute stays muted. SFX play from one preloaded Web Audio sprite. Music starts after the first tap or key, during idle, so it does not block the first paint. On iOS the context uses the media playback channel, so the ring/silent switch does not mute the game; if the sprite cannot be decoded, SFX fall back to per-file audio.
- **Học** panel has two tabs: **Khóa học** (courses still available to buy) and **Đã học** (finished courses, read-only: skill, XP granted, day completed). Empty states: “Không còn khóa để học.” and “Chưa học khóa nào.” A non-repeatable course moves to **Đã học** after one purchase.
- **Nhân vật** panel: avatar, name, stage, overall rank badge (rounded mean of the five skill levels), trait row (icon at 22px and the trait name; the bonus line is a tooltip), **Danh tiếng**, Freelance `n/100` with a bar, then the five catalog skills from `skillProgressList` (icon, name, rank badge, `Junior 60%`, bar). No stub skill percents. The trait icon uses the same 22px box as Danh tiếng and Freelance.
- Bars: 1px border, fill coral / mint / sky per vital. A vital under its warning line blinks a coral inset; a change floats above that bar. `prefers-reduced-motion` keeps the inset and drops the blink.
- Event dialog and speech bubble sit on the native M5 frames (`ui_dialog_frame`, `ui_speech_bubble`) as a 9-slice at 2×. The sleep diary is a notepad window on `ui_window_notepad` (`public/ui/m5_1/`, native and `_x2`). The store list uses `ui_store_frame` the same way, and each item sits on `ui_store_card` at 2× (192×240). That list opens from the HUD shop icon in the shared modal. Portraits and emotes use the native PNG at integer scale with `image-rendering: pixelated`. The room canvas is unchanged.

---

## Room viewport

`ROOM_VIEWPORT_W` in `GameShell` (~480px) caps CSS size; renderer still uses integer device-pixel scale internally. **Do not increase** to fill the center column without owner approval.

### Chamfered game frame

Octagonal **clip-path** frame around the room (`RoomChamferFrame`), reference `uploads/index.html`. Nested layers (outer → inner), corners cut by `--c` per layer; scale corner radius and padding with `roomWidth / 427`:

| Layer | Corner `c` | Pad | Fill |
|-------|------------|-----|------|
| f1 | 16px | 3px | `#1C1745` outer line |
| f2 | 14px | 3px | gradient `#A99CF0` → `#7E70D0` bevel |
| f3 | 12px | 7px | gradient 160deg `#4A3F8C`, `#2D2763` 60%, `#3A2F78` body |
| f5 | 6px | — | canvas clip, flush on f3, + **inset** shadow `0 4px 10px rgba(0,0,0,.5)` (scaled) |

There is **no f4 / `#15112F` inner line** and no padding between the purple body and the canvas. The canvas slot (`.room-canvas-slot`) is transparent and shrink-wraps the canvas, so the purple frame meets the canvas edge. No dark letterbox behind the canvas.

**Glow:** `.room-frame-glow` wrapper uses `filter: drop-shadow(...)` (not `box-shadow` — clip-path clips box-shadow).  
**Label plate:** chamfer `c6`, bg `#E9E4F5`, text `#3B3466`, stage title from room content.

**Side panels** use the same layers, pads, corners, and inset shadow at scale 1 (`PanelChamferFrame`), in a softer rose-lavender so the deep purple canvas stays the focus. Both columns share one color: f1 `#6A4A66`, f2 `#F8E4F2` → `#E3B4D8`, f3 `#E7C6E2` / `#D08FCB` (page-gradient pink) / `#E4B7D8`. The well is `--panel-bg` (`#F3F1F8`). Glow is `.panel-frame-glow`, lighter than the room. Inner notification and skill cards stay lavender `PanelCard`s.

Canvas sizing `ref` stays on the room-size cap box; the visible frame wraps the canvas inside it. Pointer hit-testing and `?debug=1` unchanged.

---

## Canvas exception

The **Canvas2D room renderer** is not restyled (integer scale, nearest-neighbour, no CSS shadows on canvas pixels). Debug route `/debug` unchanged.

---

## Tooltips

Chrome hints use `src/components/ui/tooltip.tsx`. Numbers live in `src/components/ui/tooltip.config.ts` (`TOOLTIP`):

| Key | Default | Meaning |
|-----|---------|---------|
| `openDelayMs` | 300 | Hover delay on a fine pointer |
| `skipDelayMs` | 120 | How long the next tip in the same provider skips that delay |
| `sideOffsetPx` | 8 | Gap between the trigger and the tip |
| `collisionPaddingPx` | 8 | Viewport inset before the tip flips |
| `enterMs` | 120 | Fade and 4px slide. `prefers-reduced-motion` skips it |
| `disableHoverableContent` | true | Leaving the trigger closes the tip. The tip has no controls |

Hover opens the tip after `openDelayMs`. Keyboard focus opens it immediately and sets `aria-describedby` on the trigger while the tip is open. A coarse pointer opens it on tap; a tap outside, or Escape, closes it. The character-card trait row uses this for the bonus line. The HUD shop and sleep icons use it for “Cửa hàng” and “Đi ngủ”.

## Modal

Popup chrome uses `src/components/ui/modal.tsx`. Numbers live in `src/components/ui/modal.config.ts` (`MODAL`):

| Key | Default | Meaning |
|-----|---------|---------|
| `overlayZ` | 40 | Backdrop. Same stack as the career panel, the food popup, and the sheet overlay |
| `contentZ` | 50 | Dialog. Same stack as sheet content and the level-up popup |
| `enterMs` | 160 | Fade and rise. `prefers-reduced-motion` skips it |
| `risePx` | 4 | How far the dialog rises while it fades in |
| `backdrop` | `rgba(42, 37, 72, 0.45)` | Dim, same tint as the other full-screen overlays |
| `maxHeightVh` | 80 | Dialog cap |
| `chromePx` | 112 | Title row and padding kept outside the scrolling body |
| `maxWidthPx` | 420 | Default width cap. The store passes `STORE_MODAL_MAX_PX` (280) |
| `viewportInsetPx` | 16 | Side inset on a narrow viewport |

The shell traps focus, closes on Escape and a backdrop click, and sets `aria-modal`. **Đóng** closes it too. The store renders the existing list inside it.

## Motion & a11y

Respect `prefers-reduced-motion`. Keep tap targets ≥ 44px on mobile where practical.
