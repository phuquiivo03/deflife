# Playful Geometric — PRIMARY design system

**This is the PRIMARY design system for devlife.** ALL UI in this repository must follow it unless the owner explicitly names another style for a feature (for example, the in-game terminal uses [TERMINAL.md](./TERMINAL.md)).

---

## Philosophy

Antidote to sterile corporate minimalism: optimism, clarity, tactile fun.

**Core concept — “Stable Grid, Wild Decoration”:** content lives in clean, readable areas; the world around it stays alive with shape and movement. Memphis Group (80s) cleaned up for screens.

**Vibe:** Friendly, Tactile, Pop, Energetic — a well-organized sticker book that invites clicking.

---

## Visual signatures

- Primitive shapes (circles, triangles, squares, pills, squiggles) as backgrounds, masks, and icons
- Hard offset shadows (no blur), sticker / cut-paper feel
- Pattern fills (polka dots, grid lines, diagonal stripes)
- Varied radii mixing full-round with sharp (leaf shapes, asymmetric blobs)

---

## Colors (light)

| Token | Value |
|-------|-------|
| background | `#FFFDF5` |
| foreground | `#1E293B` |
| muted | `#F1F5F9` |
| mutedForeground | `#64748B` |
| accent (primary brand) | `#8B5CF6` |
| accentForeground | `#FFFFFF` |
| secondary | `#F472B6` |
| tertiary | `#FBBF24` |
| quaternary | `#34D399` |
| border | `#E2E8F0` |
| input | `#FFFFFF` |
| card | `#FFFFFF` |
| ring | `#8B5CF6` |

**Rule:** use **accent** for primary actions; rotate **secondary**, **tertiary**, and **quaternary** for decorative shapes, icons, and emphasized words (confetti effect).

---

## Typography

**Owner override:** [VT323](https://fonts.google.com/specimen/VT323) (Google Fonts, `latin` + `vietnamese` via `next/font/google`) is the **only UI typeface** — body, labels, buttons, and headings (`font-sans` / `font-heading` both resolve to VT323). Base size is bumped (~`1.125rem` on `body`) because VT323 reads small at default metrics. Load with `subsets: ["latin", "vietnamese"]` so Vietnamese diacritics render correctly.

- **All UI text:** VT323 400
- **Readable fallback (optional):** Plus Jakarta Sans 400 / 500 (`font-readable`) — only for long helper copy if VT323 hurts legibility; also second in the body font stack
- **Scale ratio:** 1.25
- **Default locale:** Vietnamese (`vi`) for user-facing copy; see `src/lib/locale.ts`

---

## Radius & border

| Token | Value |
|-------|-------|
| sm | 8px |
| md | 16px |
| lg | 24px |
| full | 9999px |
| default border | 2px |

**Blob radius examples:**

- Speech bubble: `rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-none`
- Arch: `rounded-t-full rounded-b-none`

---

## Pop shadow

| State | Value |
|-------|--------|
| default | `4px 4px 0 0 #1E293B` |
| hover | `6px 6px 0 0 #1E293B` |
| active | `2px 2px 0 0 #1E293B` |

No blur.

---

## Textures

- Dot grid background
- SVG squiggle dividers / heading underlines
- Small SVG confetti shapes absolutely positioned **behind** content

---

## Components

### Primary “Candy” button

- bg `#8B5CF6`, white bold text, pill shape
- 2px `#1E293B` border
- 4px pop shadow
- hover: translate `-2px` / `-2px` + 6px shadow
- active: translate `2px` / `2px` + 2px shadow
- `ArrowRight` icon in white circle inside

### Secondary button

- transparent background, foreground text
- 2px `#1E293B` border, pill, no shadow
- hover: bg `#FBBF24`

### Sticker card

- white, 2px `#1E293B` border, `rounded-xl`
- shadow `8px 8px 0 #E2E8F0` (or `#F472B6` when featured)
- hover: rotate `-1deg`, scale `1.02`
- bold VT323 title
- floating circle icon half over the top border

### Inputs

- white, 2px `#CBD5E1` border, `rounded-lg`
- focus: border accent + `4px 4px 0` accent shadow
- labels: bold uppercase small tracking-wide

---

## Layout

- max-w-6xl container
- py-24 spacing
- 12-col grid grouped 6/6 or 4/4/4

### Marketing sections (if ever)

- Hero: text left / image right with big yellow circle and dotted pattern, blob-masked image
- Features: grid of 3 linked by dashed SVG line, alternating violet / pink / yellow headers
- Pricing: middle card scale 1.1 with yellow star “MOST POPULAR” badge rotated 15deg

---

## Motion

- Bouncy: `transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`
- Entrance: pop-in scale 0 → 1 with bounce
- Marquee for keywords
- Icon wiggle: 0 → 3deg → -3deg → 0 on hover

---

## Icons

- Lucide stroke **2.5**, round caps/joins
- White on colored circle, or dark foreground
- Always enclosed in shapes

---

## Responsive

- Stack on mobile
- Shadows **2px** on mobile
- Squiggles become vertical dividers
- Buttons min **48px** tap height
- Hide floating shapes that could overlap text

---

## Accessibility

- slate-800 on cream/white (AAA)
- Never rely on color alone
- Respect `prefers-reduced-motion` (disable bounce / wiggle)
- High-contrast focus: thick colored border + hard shadow

---

## How this applies to devlife

| Surface | Design system |
|---------|----------------|
| **Pixel-art canvas room** | **Not** restyled. Crisp pixels, integer scaling, no rounding or shadows on canvas pixels. |
| **App chrome** | **Must** follow this doc: header, stage tabs, notifications panel, Player info / Edit room tabs, buttons, cards, inputs, dialogs. |
| **In-game terminal (future)** | Scoped exception — see [TERMINAL.md](./TERMINAL.md). |

The three-column shell (768px center game column) keeps existing behavior; only chrome styling changes to Playful Geometric.
