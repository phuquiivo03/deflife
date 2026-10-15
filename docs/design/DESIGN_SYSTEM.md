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

Approximate **22% | 56% | 22%** three-column grid (`lg:grid-cols-[22fr_56fr_22fr]`).

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

## Pixel art

Room canvas, UI icons, avatars: `image-rendering: pixelated` (`.pixelated`). Do not blur or round canvas pixels.

### Icons (`public/ui/icons/`)

Art-agent PNGs with clean alpha (no chroma-key). Naming: `icon_<name>.png` and `icon_<name>_x4.png`.

| Asset | Native size | ×4 size |
|-------|-------------|---------|
| Icons | **44×44** | **176×176** |

**IDs (23):** `health`, `mood`, `energy`, `burnout`, `clock`, `level`, `job`, `reputation`, `stars`, `relationship`, `frontend`, `backend`, `devops`, `algorithms`, `english`, `communication`, `balance`, `salary`, `rent`, `food`, `savings`, `debt`, `skill_up`.

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

- HUD card under room: framed `avatar_player`, `health` / `mood` / `energy` bars, `savings` + `formatVnd`, `clock` + game day.
- Bars: 1px border, fill coral / mint / sky per stat.
- Name, title, overall level, health, and mood stay stubbed in `src/game/state/playerStats.ts`. Skill rows, energy, and money read the career store.

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
| f4 | 8px | 2px | `#15112F` inner line |
| f5 | 6px | — | canvas + **inset** shadow `0 4px 10px rgba(0,0,0,.5)` (scaled) |

**Glow:** `.room-frame-glow` wrapper uses `filter: drop-shadow(...)` (not `box-shadow` — clip-path clips box-shadow).  
**Label plate:** chamfer `c6`, bg `#E9E4F5`, text `#3B3466`, stage title from room content.

Canvas sizing `ref` stays on the inner room area; pointer hit-testing and `?debug=1` unchanged.

---

## Canvas exception

The **Canvas2D room renderer** is not restyled (integer scale, nearest-neighbour, no CSS shadows on canvas pixels). Debug route `/debug` unchanged.

---

## Motion & a11y

Respect `prefers-reduced-motion`. Keep tap targets ≥ 44px on mobile where practical.
