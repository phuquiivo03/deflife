# CRT Terminal UI — design doc

**Status:** Task-run overlay uses these tokens (`docs/systems/task-run.md`). The rest of this doc is still the broader terminal plan.  
**Audience:** Engineers implementing the in-game “desk PC” interface and anyone extending sim UI (notifications, player stats, tasks).  
**Last updated:** 2026-10-13

---

## 1. Summary

devlife will add a **retro CRT terminal** as the primary “computer screen” metaphor: a phosphor-green monospace shell that presents player identity, tasks, skills, and life events as if they were command output. Visually it inherits a portfolio-site reference (see [Appendix A](#appendix-a-original-visual-reference-prompt)) but is **scoped to a terminal surface** inside the existing `GameShell` layout—not a full-page marketing site.

The terminal is a **scoped exception** to the primary app chrome in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (Galmuri, gradient/grid shell, lavender cards). Only panels that represent “what’s on the monitor” use the CRT tokens below—not the global header, side panels, or stage tabs.

---

## 2. Goals

| Goal | Notes |
|------|--------|
| **Diegetic PC** | Opening the terminal should feel like using the in-room monitor, not leaving the game. |
| **Readable sim data** | Present future stats (money, health, career stage, tasks, bills) in a shell-native way (`whoami`, `neofetch`, `ls`, `cat`, echo lines). |
| **Visual identity** | Pure black canvas, phosphor green accent, single amber “live” accent, CRT scanlines and glow—matching the reference aesthetic. |
| **Fits current layout** | Coexist with the **768px** fixed-width game column and **left / right** side panels (`GameShell`, `NotificationsPanel`, `PlayerInfoPanel`). |
| **Accessible baseline** | Respect `prefers-reduced-motion`, maintain usable contrast for body text, don’t rely on color alone for critical state. |
| **Implementable in stack** | React + Tailwind CSS 4 + scoped CSS; no change to Canvas2D room renderer for M1-style milestones unless we add a “monitor glow” pass later. |

### 2.1 Non-goals

- **Not** replacing the global app shell (see `DESIGN_SYSTEM.md`) outside the terminal surface.
- **Not** defining final game mechanics, economy formulas, or notification rules—only UI mapping and placeholders.
- **Not** a real shell (no arbitrary command execution, no Node in the browser).
- **Not** stock photos, glossy marketing layouts, or multi-chrome rainbow palettes.
- **Not** requiring WebGL; scanlines and glow are CSS/DOM.
- **Not** M1 scope: this doc prepares a **later milestone** feature; current panels remain dashed placeholders until wired.

---

## 3. Context: current architecture

### 3.1 `GameShell` layout (as implemented)

Relevant constants and structure from `src/components/game/GameShell.tsx`:

- **`DESKTOP_GAME_W = 768`**: On `lg` (≥1024px), the **center column** (room canvas) is fixed to 768px width; height follows world aspect ratio `427×240`.
- **Three-column row** (`flex-col` on small screens, `lg:flex-row` on desktop):
  1. **Left** (`order-2` mobile / `lg:order-1`): `NotificationsPanel` — flex-1, scrollable feed placeholder.
  2. **Center** (`order-1` mobile / `lg:order-2`): `SceneCanvas` on `#15111c` letterbox background.
  3. **Right** (`order-3`): Tabs — **Player info** (`PlayerInfoPanel`) and **Edit room** (`CustomizePanel`); `lg:max-w-[400px]`, `lg:flex-1`.
- **Header** (h-14): stage switcher, character toggle, reset — unchanged by terminal v1 unless we add a global “PC” shortcut later.

Mobile stacks **game → notifications → right sidebar**; there is no separate bottom drawer for customize on desktop-wide layout anymore (customize lives in the right tab).

### 3.2 Placeholder panels

- `NotificationsPanel`: empty state copy references future **tasks, bills, life events**.
- `PlayerInfoPanel`: shows **stage** from Zustand; copy references future **money, health, assets, career stats**.

The terminal design should explain **what moves onto the CRT** vs what stays as lightweight side summaries (proposal in §5).

### 3.3 Room interaction (proposal)

`docs/PLAN.md` already defines hit-testing on scene items and selecting slots. A natural open action:

- **Primary:** click/tap the **display** item (monitor/laptop) when the character is at the desk → open terminal (or focus terminal if already open).
- **Alternate:** keyboard shortcut e.g. `` ` `` or `T` when a desk with display is present (**open question**: global vs context-gated).

No new game mechanics are required for the **visual** prototype: opening can toggle UI state only.

---

## 4. Where the terminal appears

### 4.1 Recommended shell pattern (proposal)

**“Monitor overlay”** on the center column:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ header: devlife · stages · reset                                            │
├──────────────────┬──────────────────────┬───────────────────────────────────┤
│ Notifications    │   ┌──────────────┐   │ Player info | Edit room           │
│ (cozy UI)        │   │ CRT Terminal │   │ (cozy UI)                         │
│                  │   │  768 × ~432   │   │                                   │
│                  │   │  (max)        │   │                                   │
│                  │   └──────────────┘   │                                   │
│                  │   room dimmed/     │                                   │
│                  │   paused input     │                                   │
└──────────────────┴──────────────────────┴───────────────────────────────────┘
```

- Terminal is a **positioned overlay** inside the center `<main>` (same width as game column), not over the side panels.
- Room canvas **dims** (`opacity` + optional blur **reduced** or disabled for `prefers-reduced-motion` / performance).
- **Escape** closes terminal (consistent with deselect in `GameShell`).
- Side panels remain visible so players can still glance at notifications; optional **sync** highlights new lines in the left feed when the terminal prints “shell echo” of the same event (**open question**).

### 4.2 Alternatives (not recommended for v1)

| Pattern | Pros | Cons |
|---------|------|------|
| Full-viewport modal | Maximum immersion | Hides room and panels; fights 3-column layout |
| Replace right tab content only | Simple | Doesn’t feel like “the monitor” |
| Separate route `/terminal` | Easy to test | Breaks diegesis |
| Inline split inside left panel | Always visible | Too narrow for neofetch + ls grid |

### 4.3 Desktop vs mobile

| Viewport | Behavior (proposal) |
|----------|---------------------|
| **lg+** (≥1024px) | Overlay width = `min(768, 100%)` aligned with game column; internal scroll for long session output. |
| **&lt; lg** | Full-width overlay over the game block only (still `order-1`); min height from aspect ratio. Side panels below remain cozy UI—terminal does **not** stretch to full viewport height by default (avoids hiding notifications on phones). **Open question:** optional “expand” control for fullscreen terminal on mobile. |
| **Portrait** | Same as PLAN: scene area is not the old 62vh crop in current `GameShell`; terminal scrolls inside overlay. Revisit when portrait camera crop returns. |

### 4.4 Coexistence with pixel canvas

- Terminal is **DOM** (HTML/CSS), not drawn on the 427×240 world canvas—keeps text crisp and allows real selection/copy.
- Optional later: faint **scanline overlay** duplicated on canvas for the monitor sprite only (out of scope for first DOM implementation).

---

## 5. Portfolio → in-game section mapping

Each block from the reference is a **terminal session region**, prefixed with a faux prompt line (`<user>@devlife:~/…$`).

| Reference section | Faux command | In-game use (proposal) | Data source (future) |
|-------------------|--------------|------------------------|----------------------|
| Hero `whoami --full` | `whoami --full` | **Player banner**: display name (or “Dev”), role line from **stage** (student/junior/senior), 2–3 line bio/flavor, `[x]` meta (city, years coding, job seeking). | Player profile + `useGameStore().stage`; name from future profile store. |
| `neofetch` card | `neofetch` | **Identity card**: ASCII avatar (stage-based or customizable), KV rows: OS (“Human”), Host (room title), Role, Uptime (session or in-game day), Shell, Stack (tags), Focus, **Status** (amber if “available” / employed). | `getRoom(stage)`, stats API; avatar = generated ASCII art component. |
| `ls -la ~/projects` | `ls -la ~/projects` | **Projects / jobs / tasks grid**: each card = folder (`client-app/`), permission string (flavor), description, tech tags, links (“accept”, “details”) — maps to **active quests**, freelance gigs, or repo-themed tasks. | Task/quest service (**mechanics TBD**). |
| `cat stack.txt \| sort -r` | `cat stack.txt \| sort -r` | **Skill meters**: languages/frameworks/soft skills as ASCII bars + %. | Skill model (**TBD**); M1 may use static demo data. |
| `./contact --hire` | `./pay-rent --due` or `mail` | **Action panel**: pay bill, copy account number, contact recruiter—whatever the sim needs next. | Bills/notifications (**TBD**). |
| Footer echo + git status | `history \| tail` | **Footer status**: last save time, seed/hash, “uptime” joke, version string. | `localStorage` persist metadata, build id. |

### 5.1 Side panel relationship (proposal)

| Surface | Role |
|---------|------|
| **CRT (center overlay)** | Primary, detailed, copy-friendly, “session” narrative. |
| **NotificationsPanel (left)** | Short lines: icon + one-liner + timestamp; clicking jumps/opens terminal scrolled to that “log line”. |
| **PlayerInfoPanel (right tab)** | Compact summary (3–5 stats) without CRT chrome; “Open terminal” button runs `neofetch` view or full session. |

**Open question:** Should notifications **only** render inside the terminal (left panel becomes a filter of log types) or stay dual?

### 5.2 Notifications / bills as shell output

Format life events as **stdout**:

```text
[ok]  rent paid · −2,400,000₫ · due 2026-10-01
[warn] health low · 32% · consider rest
[info] new task · fix login bug · +500k
```

- Severity drives color: default sage values; warnings may use amber (**sparingly**, same amber token as status).
- Errors could use brighter green or underline—not red (keeps palette discipline) unless a11y review demands a second hue. The test-step bug glyph is the bug-red exception in §6.1. Failure labels and negative numbers stay green.

---

## 6. Design tokens

Strict usage: **one phosphor accent** (`#39ff7a`) for emphasis, glow, keys, bars; **amber** only for live status + 1–2 tags per view.

### 6.1 Color

| Token | Hex | Usage |
|-------|-----|--------|
| `terminal-bg` | `#000000` | Canvas, window interior, overscan. |
| `terminal-phosphor` | `#39ff7a` | Primary text, prompts, links, bar fill, glow targets, selection foreground. |
| `terminal-green-mid` | `#2bbf5c` | Secondary emphasis, command buttons, borders. |
| `terminal-green-dim` | `#1c7a3c` | Scanline tint, faint rules, disabled glow. |
| `terminal-sage` | `#5f8d68` | Body copy, descriptions, KV values. |
| `terminal-amber` | `#ffd24a` | **Only** live status blip, “available”/highlight tag (max 1–2 per viewport). |
| `terminal-white` | `#ffffff` | Hero name banner only (scoped class). |
| Traffic lights | `#ff5f57`, `#febc2e`, `#28c840` | Window chrome dots only (not UI accents). |
| `terminal-bug-red` | `#ff4b4b` | **bug-red exception.** Test-step bug glyph (`.terminal-bug i`) and the task-event `> ERROR:` line. |

**Rules**

- No extra accent colors (no blue links, no purple tags), except the bug-red exception below.
- No gradients except optional **radial green wash** on `#000000` background at very low opacity.
- Side panels **outside** terminal keep existing zinc/cream palette.

**Exception — bug-red**

The crawling test-step bug sprite and a task event's `> ERROR:` line share token `terminal-bug-red` (`#ff4b4b`). The glyph is `.terminal-bug i`. The line is `.terminal-event-error`. A client requirement change prints `> WARNING:` in `terminal-amber`, blinks 3 times, and shakes lightly. Failure UI stays phosphor green: `[fail]` labels, minus numbers, and result copy are not red. Traffic-light chrome (`#ff5f57` / `#febc2e` / `#28c840`) is the window dots, not this token. Amber on the live status blip stays as it was.

### 6.2 Typography

| Role | Font | Fallback |
|------|------|----------|
| Terminal UI | **JetBrains Mono** | `ui-monospace`, monospace |
| Terminal UI alt / dense | **IBM Plex Mono** | same |

Load via `next/font/google` in `src/app/layout.tsx` (or lazy-load when terminal first opens to save bytes—**open question**). Apply only under `.terminal-root { font-family: var(--font-terminal); }`.

| Style | Size | Weight | Notes |
|-------|------|--------|-------|
| `terminal-hero-name` | ~60px | 700 | `!important` or CSS module to win over utilities; white + phosphor glow |
| `terminal-prompt` | 14px | 400 | phosphor |
| `terminal-body` | 13–14px | 400 | sage |
| `terminal-kv-key` | 13px | 500 | phosphor |
| `terminal-kv-value` | 13px | 400 | sage |
| `terminal-caption` | 11–12px | 400 | dim green / sage |

### 6.3 Glow (text-shadow)

| Token | Value | Apply to |
|-------|-------|----------|
| `glow-hero` | `0 0 12px #39ff7a, 0 0 32px rgba(57, 255, 122, 0.35)` | Hero name, role line |
| `glow-soft` | `0 0 8px rgba(57, 255, 122, 0.45)` | Buttons, bar meters, prompt |
| `glow-none` | `none` | Body sage text (performance) |

### 6.4 Spacing & layout

| Token | Value | Use |
|-------|-------|-----|
| `terminal-padding` | 16px (mobile), 24px (desktop) | Window inner padding |
| `terminal-gap` | 12px / 16px / 24px | Section stack (`gap-y-*`) |
| `terminal-radius` | 6px | Inner cards (framed ls entries) |
| `terminal-border` | 1px solid `#1c7a3c` | Frames |
| `terminal-max-w` | 720px content inside 768 column | Readable line length for prose |

### 6.5 Tailwind 4 integration (suggested)

In `src/app/globals.css` or `src/components/terminal/terminal.css`:

```css
@theme inline {
  --color-terminal-bg: #000000;
  --color-terminal-phosphor: #39ff7a;
  --color-terminal-green-mid: #2bbf5c;
  --color-terminal-green-dim: #1c7a3c;
  --color-terminal-sage: #5f8d68;
  --color-terminal-amber: #ffd24a;
  --font-terminal: var(--font-jetbrains-mono), ui-monospace, monospace;
}
```

Use semantic classes: `bg-terminal-bg`, `text-terminal-phosphor`, `shadow-glow-soft` (custom utility via `@utility` if needed in TW4).

---

## 7. Effects & motion

### 7.1 CRT scanline overlay

- **Fixed** pseudo-element on `.terminal-root::after` covering the terminal window (not the whole app).
- `background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px);`
- `mix-blend-mode: multiply; pointer-events: none; opacity: 0.35–0.5`
- Optional faint **vignette** on same layer.

### 7.2 Phosphor glow

- Text-shadow on accents only (see §6.3); avoid animating text-shadow.

### 7.3 Blinking block cursor

- Prompt and footer: trailing `▌` or block `█` with `@keyframes blink { 50% { opacity: 0 } }` (~1s step-end).
- Hero underscore under name can share cursor idiom.

### 7.4 `[x]` bullets

- Literal ASCII `[x]` in phosphor for completed/meta checks; `[ ]` for incomplete (**gameplay TBD**).

### 7.5 Text selection

```css
.terminal-root ::selection {
  background: #1c7a3c;
  color: #39ff7a;
}
```

### 7.6 Background radial glow

- `radial-gradient(ellipse at 30% 20%, rgba(57,255,122,0.08), transparent 60%)` on window background.

### 7.7 `prefers-reduced-motion`

- Disable: cursor blink (show static cursor), amber status pulse, any scanline animation (lines stay static).
- Keep: scanline texture as static overlay (not animated) unless user testing finds it distracting—then reduce opacity.

### 7.8 Accessibility & contrast

- **Sage on black** (`#5f8d68` on `#000`) ≈ 5.5:1 for small text—acceptable for secondary copy; keep **critical actions** at phosphor or mid green.
- **Amber** for status: pair with text label (“Available for work”), not color alone.
- Terminal window: `role="dialog"` + `aria-labelledby` for title bar path; focus trap while open; **Escape** closes.
- Respect zoom to 200%: sections stack; ls grid → single column.
- Motion: all blinks/pulses gated by `prefers-reduced-motion`.

---

## 8. Component inventory

| Component | Description |
|-----------|-------------|
| **TerminalWindow** | Outer chrome: traffic lights, draggable-looking title bar (non-functional ok), path label (`player@devlife: ~/career`), optional nav links as tabs (`~/stats`, `~/tasks`, `~/skills`). |
| **TerminalStatusBlip** | Amber dot + label; blink/pulse optional. |
| **TerminalPromptLine** | `$ command` prefix in phosphor. |
| **TerminalHero** | whoami block: name banner, role, intro, meta `[x]` row, CTA buttons. |
| **TerminalNeofetchCard** | ASCII avatar column + KV list + color swatch strip (decorative or maps to theme). |
| **TerminalKeyValue** | Single row key/value. |
| **TerminalProjectCard** | ls grid cell: dirname/, perms, stars/score, description, tags, actions. |
| **TerminalSkillRow** | Label + ASCII bar + percentage. |
| **TerminalAsciiBar** | `[████░░░░]` generator from 0–100. |
| **TerminalCommandBox** | Copyable command with blinking caret; copy button. |
| **TerminalPill** | Social / external link chip. |
| **TerminalButton** | Solid phosphor (`$ ls …`) and ghost (`./action`). |
| **TerminalFooter** | Copyright echo + fake git status line + cursor. |
| **TerminalScanlineLayer** | Optional subcomponent for effect isolation. |
| **TerminalOverlay** | Positions session over game column; handles dimmer + focus. |

---

## 9. Suggested component API & file layout

```
src/components/terminal/
  TerminalOverlay.tsx       # open/onClose, anchors to game column ref
  TerminalWindow.tsx        # chrome + scroll body
  TerminalSession.tsx       # composes sections; tab/nav state
  sections/
    WhoamiHero.tsx
    NeofetchCard.tsx
    ProjectGrid.tsx
    SkillProficiency.tsx
    ActionPanel.tsx
    SessionFooter.tsx
  primitives/
    TerminalPromptLine.tsx
    TerminalKeyValue.tsx
    TerminalAsciiBar.tsx
    TerminalCommandBox.tsx
    TerminalButton.tsx
    TerminalPill.tsx
    TerminalStatusBlip.tsx
    TerminalScanlineLayer.tsx
  terminal.css              # @theme tokens, selection, scanlines, keyframes
  types.ts                  # TerminalSectionId, TerminalProject, TerminalSkill, …
```

### 9.1 State & data hooks (proposal)

```ts
// src/game/state/store.ts (future slice)
terminalOpen: boolean;
terminalSection?: "home" | "tasks" | "skills";
setTerminalOpen(open: boolean): void;

// src/components/terminal/useTerminalData.ts
// Aggregates stage, room title, placeholder stats, notifications → view models
```

```tsx
// TerminalOverlay
type TerminalOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>; // game column from GameShell
};

// TerminalWindow
type TerminalWindowProps = {
  pathLabel: string;           // e.g. "dev@devlife: ~/career"
  nav?: { href: string; label: string }[];
  status?: { label: string; live?: boolean };
  children: React.ReactNode;
};

// TerminalAsciiBar
type TerminalAsciiBarProps = {
  value: number;               // 0–100
  width?: number;                // characters, default 16
  label: string;
};
```

Wire **open** from scene hit-test on display category (future handler in `SceneCanvas` / store), not from `CustomizePanel`.

### 9.2 Integration touchpoints

| File | Change (when implementing) |
|------|----------------------------|
| `GameShell.tsx` | Ref on center `<main>`; render `<TerminalOverlay />`; pass `areaRef` or column ref. |
| `SceneCanvas.tsx` | On hit display + click → `setTerminalOpen(true)` (**proposal**). |
| `PlayerInfoPanel.tsx` | “Open terminal” + deep link section. |
| `NotificationsPanel.tsx` | Items link to terminal log anchors. |
| `layout.tsx` | Load JetBrains Mono + IBM Plex Mono variables. |

---

## 10. Navigation model (proposal)

Title bar nav mirrors file paths (not Next routes):

| Link | Section |
|------|---------|
| `~/career` | whoami + neofetch (default) |
| `~/tasks` | ls projects |
| `~/skills` | cat stack.txt |
| `~/inbox` | tail notifications / bills |

Internal state only; URL sync optional (`?pc=tasks`) for share/debug.

---

## 11. Open questions

1. **Single source of truth:** Should notifications exist only in terminal output, with the left panel as a filtered view, or duplicate summaries?
2. **Open trigger:** Display click only, keyboard shortcut, or also a header button for a11y?
3. **Mobile fullscreen:** Is expand-to-viewport required for v1?
4. **Player name:** Fixed “Dev”, user-entered profile, or auth later?
5. **Real commands:** Any parser for easter eggs (`help`, `clear`) or purely decorative prompts?
6. **i18n:** Vietnamese copy in terminal (PLAN stores `en`/`vi`) — both locales in monospace?
7. **Avatar:** Procedural ASCII from stage vs custom sprite export from character?
8. **Amber semantics:** Map to employed/healthy/“good event” or strictly “available for work”?
9. **Performance:** Lazy-load fonts and terminal chunk on first open?
10. **Sound:** Typing blips / CRT hum — likely non-goal until settings exist.
11. **Persistence:** Restore last terminal tab/scroll position per session?
12. **Edit room tab:** When terminal is open, should room clicks still propagate?

---

## 12. Implementation phases (suggested)

1. **Visual shell:** `TerminalWindow` + tokens + scanlines on static mock content in Storybook or `/debug?terminal=1`.
2. **Overlay wiring:** `GameShell` + open/close + focus trap.
3. **Data binding:** Stage + room title + stub stats; wire notifications format.
4. **Scene hook:** Display click opens terminal.
5. **Polish:** reduced-motion, copy buttons, keyboard nav between sections.

---

## Appendix A: Original visual reference prompt

The following text is preserved verbatim as the owner’s visual reference (portfolio website brief). devlife adapts it to the in-game terminal as described in §5—not as a standalone 1440px marketing page.

---

"A retro CRT TERMINAL-STYLE developer PORTFOLIO website (single desktop page, 1440-wide) rendered as one fake terminal window on a pure-black #000000 canvas washed with faint green radial glows, under a fixed CRT scanline overlay. The whole page is monospace (JetBrains Mono + IBM Plex Mono) with phosphor green #39ff7a as the single accent doing all the work via text-shadow glow, over dimmer #2bbf5c / faint #1c7a3c greens and a muted sage #5f8d68 body; one disciplined amber #ffd24a accent marks a live 'available' status and one or two tags. The terminal WINDOW frames everything: a title bar with three traffic-light dots (red/amber/green), a mono path label 'ada@portfolio: ~/dev', right-aligned mono nav links (~/work, ~/stack, ~/contact) and an amber blinking 'available for work' status blip. Inside, the page reads top-to-bottom like a shell session, each section prefixed by a plausible command prompt: (1) a 'whoami --full' HERO with a big ~60px glowing pure-white NAME BANNER (scoped to a class with font-size !important + a green underscore that reads as a cursor), a phosphor-green ROLE line ('> Full-stack engineer & indie hacker'), a muted-sage 2-3 line intro, a wrap of ASCII '[x]' meta checks (location, years, availability), and two command-style CTA buttons (a solid glowing green '$ ls ~/projects ->' and a ghost './contact --hire'); (2) a 'neofetch' IDENTITY CARD panel: a green pixel ASCII avatar on the left and a right-hand key/value list (OS: Human v10.4 (engineer build), Host, Role, Uptime, Shell, Stack, Focus, Status) with green keys + sage values and an amber 'available' status, plus a small terminal color-swatch strip; (3) an 'ls -la ~/projects' WORK GRID of four framed project cards, each with a green filename + trailing slash, a right-aligned star count + file-permission string (-rwxr-xr-x), a one-line description, a row of tech tags (one amber 'open source' or 'SaaS' tag), and 'live demo' / 'source' links with green arrows; (4) a 'cat stack.txt | sort -r' PROFICIENCY block of eight mono skill rows, each a label + a glowing green ASCII bar METER + a percentage; (5) a './contact --hire' CTA panel with a headline, a copyable '$ mail ada@reyes.dev' command box with a blinking green caret, and four social pills (github, x, blog, CV.pdf); (6) a shell-echo FOOTER with a copyright echo line + blinking cursor and a fake git status line ('last commit: 2h ago, main@a1f9e2c, uptime 99.98%'). Signature effects: a fixed full-viewport CRT scanline overlay (repeating faint horizontal lines, multiply blend), phosphor text-shadow glow on the name/role/accents, blinking block cursors, ASCII '[x]' bracket bullets, and green text selection. Strictly a live-console aesthetic, never a glossy marketing page; no stock photos; the only chroma is phosphor green plus the single amber status/tag accent."
