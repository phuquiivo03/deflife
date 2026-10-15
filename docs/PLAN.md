# devlife — Milestone 1 implementation plan

> Audience: the engineer/agent implementing Milestone 1. This document is self-contained; every
> number below was measured from the files in this repo. Where a value is a judgement call it is
> marked **(tune)** and must be exposed in the debug overlay rather than hard-coded in logic.

## 0. TL;DR

- **Game:** *devlife*, a cozy 2D pixel-art developer life-sim. A Vietnamese dev progresses student → junior → senior.
- **Milestone 1 scope:** one room scene, three stages (student / junior / senior), swap or toggle furniture per slot, a character seated at the desk. No auth, no DB. The room redraws when the scene or the day/night tint changes. The day/night clock is the first sim system (§10).
- **Stack:** Next.js (App Router, TypeScript), Tailwind, shadcn/ui, Zustand, zod. Rendering is **Canvas2D**. Deploy on Vercel; Supabase comes later behind interfaces.
- **UI chrome:** [`docs/design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md) (Galmuri / soft gradient) governs all app shell UI. The canvas room is not restyled. The future in-game terminal is a scoped exception: [`docs/design/TERMINAL.md`](design/TERMINAL.md).
- **World / logical resolution:** **427 × 240 native pixels**, exactly the native room PNGs. Everything is authored in this grid. It is upscaled by an **integer factor computed in device pixels** with nearest-neighbour sampling.
- **Placement:** integer native-px coordinates. Floor items use a bottom-centre anchor and are z-sorted by baseline y. Surface items (monitor, mug…) attach to named sockets on their parent (desk, cabinet). Wall items and the rug sit on fixed layers below floor objects.
- **Character:** chroma-keyed from the JPEG sheet and downscaled by **3.5** (not 3). That gives a 40×72 seated sprite. It is drawn between the chair and a "chair overlay" (the chair cropped below its backrest top) so the backrest covers his back.
- **Ready-made targets:** `docs/data-draft/*.json` is a working layout draft. `docs/tools/render_preview.py` is a ~150-line Python reference renderer that implements the rules in this plan. `docs/art/expected_*.png` are its outputs, which are what the TS renderer must reproduce.

---

## 1. Repository inventory (what is already committed)

```
public/assets/
  rooms/room_{student,junior,senior}_empty.png        427×240 RGB  ← runtime backgrounds
  rooms/room_*_empty_original.png                     1280×720     (source, not used at runtime)
  furniture/{student,junior,senior}/<name>.png        v2, native, hard alpha, ← runtime sprites
  furniture/.../<name>_shadow.png                     v2 soft shadows (alpha ≤ 0.35), floor items only
  furniture/.../*_x2.png                              2× copies (NOT used at runtime; ignore in atlas)
  reference/reference_{student,junior,senior}.jpg     1280×720 furnished reference layouts
  character/character_sheet.jpg                       1280×720, 6 poses on magenta (#D1115A)
docs/
  PLAN.md                                             this file
  data-draft/items.json, room_{stage}.json            draft content (copy into src/game/content/)
  tools/render_preview.py                             reference renderer (Python+Pillow, offline)
  art/expected_{stage}.png                            reference renders at 3× (targets)
  art/expected_junior_swap_example.png                cross-stage swap example (senior desk set in junior room)
  art/character_cut/char_{pose}.png                   reference character cut-outs (native)
  art/composite_{stage}_v{1,2}.png, compare_*.png     placement hints supplied with the assets (1281×720 = 3×)
  art/mismatch_report.csv                             per-item v1→v2 rescale report (columns below)
  art/assets_v1/                                      original (pre-rescale) furniture, archive only
  art/preview_*.png                                   contact sheets
  art/study_*.png                                     scale / layering studies used for decisions here
```

`mismatch_report.csv` has no header. Its columns are `stage, item, v1 size, size in reference, Δw, Δh, applied scale`.

Run the reference renderer (needs `pip install pillow numpy`):

```bash
python3 docs/tools/render_preview.py   # rewrites docs/art/expected_*.png and character_cut/
```

---

## 2. Scale & coordinate system

### 2.1 Measurements

**Rooms.** The native rooms are 427×240 and the originals are 1280×720 (= 3× of 426.67, so the native width is rounded). The composites provided are 1281×720 = exactly 3× native. The composites differ from the empty rooms by **0** in untouched pixels, so the native PNGs are the canonical background. All three rooms share the same camera: a front-facing ¾ view with a mild one-point perspective.

| Room | Back wall (x0..x1, y0..y1) | Floor starts at y | Notes |
|---|---|---|---|
| student | 12..427, 6..121 | 122 | Wainscot tiles y≈71–121. Left wall slants from (12,122) down to (0,~140). |
| junior | 14..427, 6..115 (+baseboard 115–121) | 122 | The plain wall here differs from the reference, which has green tiles. The empty PNG wins. |
| senior | 27..400, 6..125 (+baseboard to 130) | 131 | Side walls: left edge (27,131)→(0,200), right edge (400,131)→(427,200). |

The floor tiles in the student room are perspective-projected. Their pitch is ≈25 px at the back row and ≈29 px at the front row. **The floor is therefore not a placement grid.** Placement uses free integer pixel coordinates.

The room art has an effective "art pixel" ≈ 1 native px (3 source px).

**Furniture (v2, source of truth).** Every sprite has hard alpha (0 semi-transparent pixels) and a 0–2 px transparent padding that the atlas trims away. Placements were recovered from `composite_*_v2.png` by exact template matching: 97–100 % of opaque pixels match exactly, except where occluded. These placements are the default anchors in `docs/data-draft`.

| Stage / item | trimmed w×h | default anchor (bottom-centre) | v1→v2 scale | flag |
|---|---|---|---|---|
| student/mattress | 111×83 | (45,221) | 1.40 | resampled up |
| student/folding_table | 89×35 | (262,133) under the window | native | redrawn; shadow kept; no chair |
| student/plastic_stool | 37×42 | seat socket | 1.10 | |
| student/fan | 36×70 | (126,144) | 1.12 | |
| student/bedside_cabinet | 40×44 | (158,139) | 1 | |
| student/backpack | 42×52 | (110,221) | 1 | |
| student/books_stack | 42×43 | (143,235) | 1 | |
| student/laptop | 48×36 | desk.display `[0,−19]` | native | redrawn |
| student/mouse | 9×7 | desk.mouse | 0.70 | |
| student/kettle | 21×24 | cabinet.top | 0.75 | |
| student/noodle_cup ×2 | 15×20 | (203,128), (189,126) | 0.73 | |
| student/clothesline (wall) | 116×45 | (66,78) | 0.80 | |
| student/mirror (wall) | 25×34 | (84,83) | 0.90 | |
| junior/bed | 90×118 | (46,203); left edge at x=1 | native | redrawn (pillow + blanket); shadow kept |
| junior/desk | 140×54 | (205,153) | native | redrawn front-on; sockets unchanged |
| junior/office_chair | 49×68 | seat socket | 1.18 | |
| junior/drawer_pedestal | 30×35 | desk.under | 0.65 | |
| junior/monitor | 61×41 | desk.display | 0.79 | |
| junior/laptop_stand | 39×42 | desk.side | 0.71 | |
| junior/keyboard_mat | 59×19 | desk.keyboard | 0.63 | |
| junior/mouse | 10×10 | desk.mouse | **0.40** | heavy downsample |
| junior/mug | 14×14 | desk.cup | **0.51** | heavy downsample |
| junior/plant_small | 15×22 | desk.plant | **0.53** | heavy downsample |
| junior/bookshelf | 63×74 | (312,133) | 1.25 | moved left to sit beside the wardrobe |
| junior/wardrobe | 78×108 | (408,134); right edge at x=447 (overflows by 20) | native | redrawn; shadow kept |
| junior/poster_1, poster_2 (wall) | 23×32, 17×22 | (43,60), (70,59) | 0.74, **0.58** | |
| senior/standing_desk | 161×70 | (218,175) | 1.41 | |
| senior/ergo_chair | 51×81 | seat socket | 1.28 | |
| senior/dual_monitor | 94×36 | desk.display | 0.80 | |
| senior/keyboard_mat | 63×22 | desk.keyboard | 0.72 | sprite already includes a mouse |
| senior/drawer_pedestal | 21×33 | desk.under | 0.71 | |
| senior/plant_small, smart_speaker | 13×22, 10×19 | desk.plant, desk.gadget | 0.79, 0.82 | |
| senior/sideboard | 68×49 | (60,152) | 1.25 | |
| senior/espresso_machine, coffee_grinder | 32×44, 17×29 | cabinet.top, cabinet.top2 | 1, 0.87 | |
| senior/armchair | 63×75 | (39,220) | 1.13 | |
| senior/bookshelf | 76×106 | (361,149) | 1.50 | resampled up |
| senior/monstera | 54×77 | (380,171) | 1.09 | |
| senior/rug (decal) | 170×64 | (217,222) | **1.71** | heavy resample |
| senior/frame_1, frame_2 (wall) | 21×28, 21×27 | (100,74), (310,79) | 0.62, 0.67 | **front-on: back wall only** |

**Character (`character_sheet.jpg`).** Background key = RGB(209,17,90), per-channel σ < 1. Pose bounding boxes in sheet pixels, with a few px of margin:

| pose | rect x0,y0,x1,y1 (1280 space) | size ÷3 | size ÷3.5 (chosen) |
|---|---|---|---|
| front | 66,194,196,492 | 41×97 | **35×83** |
| back | 272,197,399,494 | 40×96 | **34×83** |
| left | 471,200,602,494 | 41×95 | **35×82** |
| right | 665,200,796,494 | 41×95 | **35×82** |
| sit_back (cross-legged, from behind) | 858,228,1006,487 | 47×84 | **40×72** |
| sit_side (typing, facing right) | 1071,236,1244,482 | 55×79 | **47×68** |

An FFT of horizontal colour edges gives a dominant period of **≈3.5 source px** per art pixel for the character, versus 3.0 for the rooms. So the sheet was drawn on a coarser grid. Downscaling by 3.5 maps his art pixels ~1:1 onto native pixels. ÷3 makes him visibly too large: his head covers the whole monitor and he stands taller than the wardrobe. See `docs/art/study_character_seated_scale.png` and `study_character_standing_scale.png`.

Sanity checks at ÷3.5:
- Standing height of 83 px ≈ 72 % of the back-wall height (116 px) and ≈ 77 % of the wardrobe (108 px). That's plausible for a chibi with a big head.
- Seated, his head reaches the bottom of the monitors.

### 2.2 Decisions

1. **Logical resolution = world = 427×240**, defined in one place, `src/game/config.ts`:
   ```ts
   export const WORLD = { w: 427, h: 240 } as const;   // native art grid, never scaled at runtime
   export const UNITS = 'px@427x240';                  // stamped into every content JSON
   ```
   - *Why not 480×270 or 640×360?* The art only exists on the 427×240 grid. 480×270 would need either padding (53 px of fake wall/floor) or a non-integer resample (×1.124), which destroys pixel art. 640×360 is a ×1.5 resample.
   - The only gain of 480×270 is "4× = 1920×1080 exactly". 427×240 already hits 1281×720 at 3× and 1708×960 at 4×, which is close enough with letterboxing.
   - Odd width is fine. Centre = 213, and nothing depends on halving the world.
2. **Integer scaling in device pixels**, never CSS pixels. This is what makes phones look good: a 390 css-px phone at DPR 3 has 1170 device px.
   ```
   devW = floor(areaCssW * dpr), devH = floor(areaCssH * dpr)
   scale = max(1, floor(min(devW / view.w, devH / view.h)))
   canvas.width = view.w * scale; canvas.height = view.h * scale        // backing store, device px
   canvas.style.width = canvas.width / dpr + 'px'  (same for height)       // may be fractional css px
   ```
   - Use `ResizeObserver` with `devicePixelContentBoxSize` when available (fallback: `contentRect × devicePixelRatio`). Re-run on `matchMedia('(resolution: Xdppx)')` change.
   - Render the world into a 427×240 offscreen canvas at 1×. Blit it to the visible canvas with `imageSmoothingEnabled = false` and integer `scale`.
   - CSS on the canvas: `image-rendering: pixelated;` as a safety net.
   - Letterbox colour = `room.letterbox` (default `#15111c`, matching the dark ceiling band).
3. **Mobile portrait = camera crop + pan, not letterbox.** Letterboxing the full room on a 390×844 phone gives a 285 css-px-wide scene, which is too small. Instead:
   ```
   if (area is portrait) {
     scale  = max(1, min(floor(devW / MIN_VIEW_W), floor(PORTRAIT_SCENE_MAX_H * devH / WORLD.h)))
     view.w = min(WORLD.w, floor(devW / scale)), view.h = WORLD.h
     camera.x = clamp(room.focusX - floor(view.w / 2), 0, WORLD.w - view.w)   // integer
   }
   MIN_VIEW_W = 200            // desk cluster + chair must always be visible (tune)
   PORTRAIT_SCENE_MAX_H = 0.62 // leave ≥38 % of height for the item picker (tune)
   ```
   - The player can pan horizontally by dragging or swiping the canvas, plus `‹ ›` buttons for accessibility. The camera is clamped and snapped to integer native px. Selecting a slot recentres the camera on that item.
   - Expected results:

| Device (CSS viewport, DPR) | scene area | mode | scale (device) | shown native | CSS size |
|---|---|---|---|---|---|
| 1920×970, 1 | 1920×914 | full | 3 | 427×240 | 1281×720 |
| 1440×790, 2 | 1440×734 | full | 6 | 427×240 | 1281×720 |
| 1366×660, 1 | 1366×604 | full | 2 | 427×240 | 854×480 |
| 1280×600, 1.5 | 1280×544 | full | 3 | 427×240 | 854×480 |
| iPhone landscape 844×340, 3 (header overlaid) | 844×340 | full | 4 | 427×240 | 569×320 |
| iPhone portrait 390×750, 3 | 390×750 | crop | 5 | 234×240 | 390×400 |
| Android portrait 412×800, 2.625 | 412×800 | crop | 5 | 216×240 | 411×457 |

4. **Placement unit system.** Every coordinate in content is an **integer in native world px**.
   - `anchor = [x, y]` is where the sprite's **pivot** lands.
   - Default pivot is the **bottom-centre of the trimmed frame**: `pivotX = floor(trimW / 2)`, `pivotY = trimH`. So the draw top-left is `(x − floor(w/2), y − h)`.
   - Floor items: anchor = the floor contact point, and `baseline = anchor.y`.
   - Wall items: the anchor is bottom-centre too, but on the wall. They live on the wall layer and are never depth-sorted against floor items. Validation: their bbox must lie inside `room.bounds.backWall`. All current frames and posters are front-on, so **back wall only**. There are no side-wall slots until angled art exists.
   - Surface items: `anchor = parent.anchor + parentItem.sockets[socketName]`. Offsets are in the parent item's data, so swapping a desk carries monitor, mug and the rest to the new desk's positions.
   - Seat: `chair.anchor = desk.anchor + deskItem.seat`. See §2.4.
   - Sprites may hang off-screen. For example, the junior bed starts at x = −14 and the wardrobe ends at x = 447, matching the reference crop. The renderer must clip, not clamp.
5. **Draw order** (verified against the composites, where every overlapping pair was checked):
   ```
   layer 0  background (room PNG)
   layer 1  wall items          sort by anchor.y, then slot order
   layer 2  decals (rug)        sort by anchor.y
   layer 3  floor shadows       all shadows, any order (they're ≤0.35 alpha, drawn before objects)
   layer 4  objects             sort key = (baseline, sub)
              floor item:       baseline = anchor.y,          sub = (0, 0)
              surface child:    baseline = parent.baseline,   sub = (1 + socketOrder[socket], anchor.y)
              chair:            baseline = chair anchor.y,    sub = (0, 0)
              character:        baseline = chair anchor.y,    sub = (1, 0)
              chair overlay:    baseline = chair anchor.y,    sub = (2, 0)
   ties: slot index in room JSON (stable sort)
   socketOrder = [under, display, side, plant, gadget, keyboard, cup, top, top2, mouse]
   ```
   Pure baseline sorting fails exactly where the composite check said it would:
   - surface items vs. their desk or cabinet: fixed by parenting;
   - the rug vs. everything: fixed by the decal layer;
   - the drawer pedestal vs. the desk (1 px apart, pedestal must be in front): fixed by `under` being a socket child;
   - mouse vs. keyboard mat: fixed by socketOrder.

   An optional per-item `zBias` (integer, added to baseline) exists for future art, but none is needed today.
6. **Shadows.** For any item with `shadow` placed on the floor (floor items and chairs), draw the shadow centred on the anchor: `x = anchor.x − floor(sw/2)`, `y = anchor.y − floor(sh/2) − 1`. A per-item `shadowOffset: [dx, dy]` override is available (tune). Shadow pixels are the only semi-transparent pixels in the game, which is fine because they're blended at 1× in the world canvas before upscaling.
7. **Easy to rescale later.**
   - All sizes come from the atlas and all positions come from content JSON stamped with `units`.
   - If the art is ever re-authored on another grid, change `WORLD` and run a one-off migration that multiplies every coordinate (integer factor only, otherwise re-place by hand).
   - Nothing in TS code may contain a magic pixel coordinate except `config.ts`. The debug overlay (§7.4) is the tool to re-tune.

### 2.3 Items whose scale looks off & normalisation policy

- **Never scale sprites at runtime.** Normalisation happens offline in the art source, and the v2 files are accepted as-is for M1.
- Heavy non-integer resamples in v2 produce uneven "double pixels" and soft detail:
  - upscaled: junior desk ×1.73, rug ×1.71, wardrobe ×1.65, senior bookshelf ×1.50, standing desk ×1.41, mattress ×1.40, junior bed ×1.35;
  - downscaled: junior mouse ×0.40, mug ×0.51, plant ×0.53, poster_2 ×0.58.

  Put these in `docs/ART_TODO.md` (create it) as redraw-at-native candidates, with priority: wardrobe, junior desk, junior bed (also wrong angle or proportions), then rug and the small downsampled props.
- Known art issues to carry into `ART_TODO.md`: junior **wardrobe** and **desk** are drawn from a different angle than the room and need a redraw. Junior **bed** proportions are off. All **frames/posters are front-on**, so they only go on the back wall.
- Lighting: the senior room has a warm light pool, while the props are neutrally lit. Leave it for M1; a later milestone may add `room.ambientTint` as a multiply pass on layer 4.
- Mixed-stage swaps (e.g. a senior standing desk in the student room) are allowed in M1 and look acceptable; see `docs/art/expected_junior_swap_example.png`. Overlaps with neighbours are tolerated, with no collision logic.

### 2.4 Character cut-out and seating

**Cut-out (build-time script, not runtime).** Port `cut_pose()` from `docs/tools/render_preview.py`:
1. Crop the pose rect from the JPEG and compute `dist = |rgb − (209,17,90)|`.
2. Soft alpha in source space: `alpha = clamp((dist − 60) / 80, 0, 1)`.
3. Despill edge pixels: where `min(R,B) > G` and alpha < 1, clamp R and B to `G + 30`. This kills the pink halo visible in `study_character_seated_scale.png` at ÷3.
4. Downscale by **3.5** with a box filter on premultiplied RGB. Un-premultiply, then **threshold alpha at 128** so the result has hard alpha only, like the furniture.
5. Trim, then save `public/assets/character/derived/char_<pose>.png`.

   Expected sizes: front 35×83, back 34×83, left/right 35×82, sit_back 40×72, sit_side 47×68. `docs/art/character_cut/` holds reference outputs. A ±1 px difference is fine.
6. Config lives in `scripts/assets/character.config.ts`: rects, key, thresholds, `CHAR_DOWNSCALE = 3.5`.

M1 uses only `sit_back`. The other poses are cut now for later milestones. The future layered or customisable character replaces this JPEG source; keep the pose rects in config so that swap is painless.

**Seating geometry.** All values are relative to the chair anchor (chair bottom-centre), and the character pivot is the hip.
- Character `sit_back` pivot (hip) = `(floor(w/2), h − 9)` (tune).
- Chair data:
  - `seatPoint` = where the hip goes:
    - office_chair `[0,−25]`
    - ergo_chair `[0,−31]`
    - plastic_stool `[0,−33]`
  - `overlayFromY` = the chair rows drawn *over* the character, from `anchor.y + overlayFromY` down to the bottom:
    - office_chair `−48`
    - ergo_chair `−55`
    - stool: none, because he sits on top of it
- Draw: chair (full sprite) → character → chair overlay (same sprite, source rect cropped to rows ≥ `h + overlayFromY`). In Canvas2D that's `drawImage(atlas, sx, sy + cut, w, h − cut, x, y + cut, w, h − cut)`.
- Studied options (`docs/art/study_chair_overlay_cut.png`):
  - Cutting at the backrest top (≈25 % of chair height) reads correctly: head and shoulders above the backrest, armrests and base in front.
  - Mid-height cuts leave a visible horizontal seam.
  - Drawing the character fully over the chair looks like he is standing in front of it.
- Desk `seat` offsets (where the chair anchor goes):
  - folding_table `[0,6]`: in front of the table, under the window. The room default leaves the chair empty.
  - junior desk `[5,22]`
  - standing_desk `[1,35]`
- No chair, and the desk defines `floorSit`: hip at `desk.anchor + floorSit.offset`, sprite from `poses[floorSit.pose]`, drawn on the desk's baseline after every socket named in `drawAfter` (later sockets stay in front). The student table uses pose `sit_floor` (`character/derived/char_sit_floor.png`, hip 9px from the bottom) and `drawAfter: ["display"]`, so the head covers the laptop and the mouse stays in front.
- No chair and no `floorSit`: hip at `desk.anchor + desk.seat + [0, −4]` with `sit_back` (the previous fallback).
- Toggle "Show character" hides him.
- Long-term the art should provide split `chair_back` / `chair_front` layers. When those exist, the item JSON gets `overlaySprite` and `overlayFromY` is dropped. Keep the renderer code path generic: "draw overlay = sprite + optional source rect".

---

## 3. Rendering choice

**Recommendation: Canvas2D**, behind a small `Renderer` interface so PixiJS can replace it later if animation or particles demand it.

| | Canvas2D (chosen) | PixiJS via @pixi/react | DOM/CSS absolutely-positioned `<img>` |
|---|---|---|---|
| Pixel-exact integer upscale | Trivial: draw at 1× and blit with smoothing off | Yes (`roundPixels`, nearest scale mode), more config | Fragile: `image-rendering` support on transformed imgs varies (Safari), sub-pixel layout with fractional DPR blurs edges |
| Bundle | 0 KB | ~450 KB min (pixi v8) + @pixi/react | 0 KB |
| Shadows / alpha / source-rect overlay | Native `drawImage` with source rect | Yes | Needs `clip-path`/wrappers per overlay |
| Hit-testing on transparent pixels | Alpha lookup in atlas ImageData | Built-in (with hitArea) | Bbox only, unless you add canvas lookups anyway |
| Static scene, redraw on change | Ideal (~30 draws ≈ <1 ms) | Overkill (WebGL ticker) | OK |
| SSR / Next | Client component, `useEffect` | Client-only, WebGL context loss handling | Fine |

The scene is static: ~30 sprites, redrawn only when state, resize or hover changes, with no ticker. Canvas2D gives deterministic pixels for screenshot tests, and the atlas JSON format (below) is Pixi-compatible for a later migration.

Renderer details:
- `createRenderer(canvas) → { setScene(drawList), setView(camera, scale), setHighlight(entryId | null), destroy() }`.
- `drawList` comes from a pure function, `resolveScene(room, items, loadout, opts)`, which is unit-tested. The renderer does no layout logic.
- Highlight (hover/selected): precompute a 1-px outline per frame at load. Dilate the alpha by 1 px in 4 directions, subtract the original, fill `#fff6d5`, and draw it right after the entry. Prefer drawing the outline into the world canvas (1 native px). Drawing it after upscale (1 device px) is fine as a fallback.
- Hit-testing: map the pointer to world coords (`(clientX − rect.left) * dpr / scale + camera.x`). Walk the draw list **top-down** and return the first entry whose atlas alpha at the local pixel is > 127. Skip the background and shadows; wall items and the rug are hittable. Read atlas ImageData once into a `Uint8ClampedArray`.

### 3.1 Texture atlas packing

- Build-time script `scripts/assets/build-atlas.ts` (Node, `sharp` + `maxrects-packer`):
  - Inputs: `public/assets/furniture/**/<name>.png` and `*_shadow.png` (excluding `*_x2.png`), plus `public/assets/character/derived/*.png`.
  - Trim each sprite to its alpha bbox. Record `spriteSourceSize`, `sourceSize` and `pivot` (bottom-centre of the trimmed frame).
  - Shadows are **not** trimmed; they're positioned by their full size.
  - Pack with 1-px padding and no rotation, power-of-two off, max 1024×1024. The total area is ≈195 k px², so expect ~512×512.
  - Output `public/atlas/devlife.png` + `public/atlas/devlife.json` in TexturePacker "JSON Hash" format, so Pixi can read it later. Key = the sprite path used in content, e.g. `furniture/junior/desk`.
  - Commit the outputs, so the build doesn't depend on sharp at deploy time. CI runs the script and fails if `git diff` is non-empty.
- Rooms are **not** atlased: one 427×240 PNG per room, loaded on demand and cached. Preload the other two after first paint.
- `scripts/assets/validate.ts`:
  - every `sprite`/`shadow` referenced in content exists in the atlas;
  - non-shadow frames have only alpha 0/255;
  - wall items fit `bounds.backWall`;
  - every `default` item's category is in the slot's `accepts`;
  - every surface/seat slot's parent exists;
  - all coordinates are integers.

---

## 4. Folder structure

```
app/
  layout.tsx                 fonts (pixel font for headings e.g. "Pixelify Sans" via next/font, Inter for UI), metadata
  page.tsx                   server component → <GameShell/> (client)
  globals.css                tailwind, .pixelated { image-rendering: pixelated }
  debug/page.tsx             dev-only (notFound() in production): renders a stage at fixed scale for tests/tuning
src/
  game/
    config.ts                WORLD, UNITS, MIN_VIEW_W, PORTRAIT_SCENE_MAX_H, CHAR settings, colours
    types.ts                 Item, Room, Slot, Loadout, DrawEntry, ViewState
    content/
      items.json             ← from docs/data-draft/items.json
      rooms/student.json …   ← from docs/data-draft/room_*.json
      schema.ts              zod schemas + inferred types
      index.ts               StaticContentSource (imports JSON, validates once)
      source.ts              interface ContentSource { getItems(); getRoom(id) }   (Supabase later)
    layout/
      resolveScene.ts        (room, catalog, loadout, opts) → DrawEntry[]   PURE
      sort.ts                compareEntries()                                PURE
    view/
      computeView.ts         (areaCss, dpr, room) → { scale, view, mode, cameraX }  PURE
      camera.ts              clamp / pan / focus helpers                     PURE
    render/
      atlas.ts               load png+json → { image, frames, alpha }
      canvasRenderer.ts      Renderer implementation
      outline.ts             precomputed outlines
      hitTest.ts
    state/
      store.ts               zustand store (+ persist)
      persistence.ts         interface LoadoutRepository; LocalStorageRepository
  components/
    game/
      GameShell.tsx          layout: header, scene, customize panel; loading/error states
      SceneCanvas.tsx        canvas, ResizeObserver, pointer events, pan
      StageSwitcher.tsx      shadcn Tabs / ToggleGroup
      CustomizePanel.tsx     desktop: right Sheet / side panel; mobile: bottom Drawer
      SlotRow.tsx            one slot: label, toggle, variant thumbnails
      ItemThumb.tsx          atlas frame rendered via small canvas (pixelated, integer scale)
      DebugOverlay.tsx       anchors, baselines, bounds, live offset nudging (dev only)
    ui/                      shadcn generated components
scripts/assets/
  cut-character.ts, character.config.ts, build-atlas.ts, validate.ts
public/assets/ …             source art (as committed)
public/atlas/ …              generated
tests/
  unit/*.test.ts             vitest
  e2e/*.spec.ts              playwright (+ __screenshots__)
docs/ …
```

---

## 5. Data model

All JSON is validated with zod at load. In dev this throws with a readable path; in prod it shows the error state. The drafts in `docs/data-draft` already match this schema, so copy them and add `name` strings.

```ts
type Vec = [number, number];                         // integer native px

type Item = {
  id: string;                                        // "junior.desk"
  stage: 'student' | 'junior' | 'senior';            // origin, used for badges / future unlocks
  category: Category;                                // see list below
  kind: 'floor' | 'surface' | 'wall' | 'decal';
  sprite: string;                                    // atlas key
  shadow?: string;                                   // atlas key
  name: { en: string; vi: string };                  // UI copy (add during implementation)
  pivot?: Vec;                                       // override; default bottom-centre of trimmed frame
  shadowOffset?: Vec;
  zBias?: number;
  sockets?: Partial<Record<SocketName, Vec>>;        // desks & cabinets; offsets from own anchor
  seat?: Vec;                                        // desks: chair anchor offset from desk anchor
  seatPoint?: Vec;                                   // chairs: hip position from chair anchor
  overlayFromY?: number;                             // chairs: overlay rows start (relative to anchor.y)
  notes?: string[];                                  // art issues, shown in debug overlay only
};

type SocketName = 'display'|'side'|'keyboard'|'mouse'|'cup'|'plant'|'gadget'|'under'|'top'|'top2';
type Category = 'bed'|'desk'|'chair'|'display'|'side_device'|'keyboard'|'mouse'|'cup'|'desk_plant'
  |'gadget'|'under_desk'|'cabinet'|'appliance'|'shelf'|'wardrobe'|'floor_decor'|'lounge'|'rug'
  |'wall_art'|'wall_hanging';

type Slot = {
  id: string;                                        // unique within room, e.g. "display"
  kind: 'floor' | 'surface' | 'seat' | 'wall' | 'decal';
  accepts: Category[];
  default: string | null;                            // item id; null = empty by default
  anchor?: Vec;                                      // floor/wall/decal slots
  parent?: string;                                   // surface/seat slots: parent slot id
  socket?: SocketName;                               // surface slots
  required?: boolean;                                // desk: cannot be set to none
  label?: { en: string; vi: string };
  group?: 'desk' | 'room' | 'wall';                  // UI grouping
};

type Room = {
  id: 'student' | 'junior' | 'senior';
  title: string;
  background: string;                                // path under /assets, no extension
  size: Vec;                                         // must equal WORLD
  bounds: { backWall: [number, number, number, number]; floorTopY: number; /* optional edges */ };
  focusX: number;                                    // camera focus in portrait
  letterbox?: string;
  slots: Slot[];
};

type Loadout = Record<string /*slotId*/, string | null /*itemId*/>;   // missing key = slot default
```

Resolution rules (`resolveScene`):
- A surface/seat slot whose parent resolves to nothing is skipped, as is one whose parent item lacks that socket. Example: the folding table has no `under` socket, so the drawer pedestal disappears; no error.
- An item is valid for a slot iff `slot.accepts.includes(item.category)`. Invalid persisted values fall back to the default.
- The same item id may appear in several slots: the student room has two noodle cups.
- The character is emitted iff `opts.showCharacter` and the room has a seat slot.

**Variants & toggles.** "Variants" are all catalog items whose category is accepted by the slot, across all stages; in M1 everything is unlocked. Each item shows a badge with its origin stage. "Toggle" = set the slot to `null` unless `required`. "Reset room" clears that stage's loadout.

**Supabase later.** Content and player data stay behind interfaces, so only adapters change.
- `items` (id pk, stage, category, kind, sprite, shadow, data jsonb).
- `rooms` (id pk, data jsonb) — or normalised `room_slots`.
- `player_loadouts` (user_id, stage, slot_id, item_id null, updated_at; pk(user_id, stage, slot_id)) with RLS `user_id = auth.uid()`.
- Later: `player_unlocks` (user_id, item_id).
- The JSON files become the seed script (`supabase/seed.ts`).
- Adapters: `SupabaseContentSource` and `SupabaseLoadoutRepository` implement the existing interfaces.

---

## 6. State management

Zustand with `persist` → localStorage key `devlife:v1`. Include a `version` and `migrate` from day one. **Version 2** adds the in-game clock (`totalMinutes`). v1 saves migrate to day 1, 08:00. See [`docs/systems/time.md`](systems/time.md).

```ts
type GameState = {
  stage: StageId;                                    // default 'student'
  loadouts: Record<StageId, Loadout>;                // per stage, sparse (only overrides)
  showCharacter: boolean;                            // default true
  totalMinutes: number;                              // in-game clock, persisted (v2)
  selectedSlot: string | null;                       // UI only, not persisted
  hoveredSlot: string | null;                        // UI only, not persisted
  cameraX: Record<StageId, number | null>;           // portrait pan, not persisted
  setStage(s); setSlotItem(slotId, itemId | null); cycleVariant(slotId, dir: 1|-1);
  resetStage(); selectSlot(id | null); setHover(id | null); setShowCharacter(b);
};
```

- Persist `stage`, `loadouts`, `showCharacter`, and `totalMinutes` (`partialize`). Dev clock speed and pause are not persisted.
- Hydration: render the loading skeleton until `persist.hasHydrated()` and the atlas are both ready. This avoids SSR mismatch; the canvas is client-only anyway.
- Derived scene = `useMemo(() => resolveScene(room, catalog, loadouts[stage], { showCharacter }), [...])` → `renderer.setScene()`. Hover and selection only call `setHighlight`.
- Optional URL sync: `?stage=junior` is read on load (shareable) and written with `router.replace` on change.

---

## 7. UI

All shell chrome (header, side panels, tabs, buttons, cards, inputs) must follow **[`docs/design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md)**. Do not apply those tokens to the Canvas2D scene. The CRT terminal surface, when built, follows **[`docs/design/TERMINAL.md`](design/TERMINAL.md)** instead.

### 7.1 Layout

- **Desktop/landscape (≥ 768 px wide, landscape):**
  - Top bar (h-14): the "devlife" wordmark in a pixel font, then the **stage switcher**, a segmented control of 3 items: "Student · Sinh viên", "Junior", "Senior". Each item has an icon: backpack / mug / espresso.
  - Right side of the top bar: "Customize" button, a "Show character" toggle and "Reset room".
  - Below: the scene, centred and letterboxed.
  - Customize panel: shadcn `Sheet` (side="right", w-[360px], non-modal), so the scene stays visible. If the window is ≥ 1280 px wide, show it docked and open by default; the scene area then shrinks and the scale recomputes.
- **Mobile portrait:**
  - Compact top bar with the stage switcher.
  - Scene in camera-crop mode, at most 62 % of the height, with pan arrows overlaid at the left and right edges.
  - Below it: an always-visible panel with slot chips in a horizontal scroll ("Desk", "Chair", "Screen", "Bed"…). Tapping a chip shows its variants in a horizontal list of thumbnails. Use a shadcn `Drawer`, or a plain section, at 38 % of the height.
- **Mobile landscape:** the header collapses into a floating pill overlaying the letterbox. The Customize button opens the Sheet from the right.

### 7.2 Interactions

- Click or tap an item in the scene → select its slot. The item gets a highlight outline, the Customize panel opens or scrolls to that slot, and in portrait the camera centres on it.
- Hover (pointer devices) → outline plus a tooltip with the item name.
- Slot row: label, current item name, a `Switch` for on/off (hidden if required), and a `ToggleGroup` of variant thumbnails. Thumbnails are atlas frames drawn at integer scale (2× or 3× to fit 48×48), pixelated, with a stage badge. The "None" option is an empty-slot thumbnail.
- Keyboard:
  - `1`/`2`/`3` switch stage;
  - `Tab` moves through slot rows;
  - `[` / `]` cycle variants of the selected slot;
  - `C` toggles Customize;
  - `Esc` deselects.
- All controls need accessible labels. The canvas gets `role="img"` and an `aria-label` summarising the scene, e.g. "Junior apartment: wooden desk, monitor, office chair…".
- Stage switch: 120 ms fade of the canvas (CSS opacity). Respect `prefers-reduced-motion`.

### 7.3 States

- **Loading:** a skeleton the size of the computed scene plus a "Loading your room…" pixel spinner, shown until the atlas, room PNG and hydration are ready.
- **Error:** an asset fetch failure or schema error shows a card: "Couldn't load the room art." with a Retry button. In dev, also show the zod error.
- **Empty:** if every optional slot is off, show a subtle hint over the scene: "Your room is bare. Add something from Customize."

### 7.4 Debug overlay (dev only; `?debug=1` or `D` key)

- Draws in world space on the scene:
  - anchors (1-px cross);
  - baselines;
  - `bounds.backWall` and `floorTopY`;
  - sprite bboxes;
  - socket points of the selected parent;
  - the seat point and overlay cut line.
- Panel: the selected entry's anchor and offsets with ±1 px nudge buttons, plus a **"Copy JSON"** button that copies the patched slot or item to the clipboard. This is how all (tune) values get finalised. Also shows `scale`, `dpr`, view rect and mode.

---

## 8. Tests & acceptance criteria

### 8.1 Unit (vitest)

- `schema`: all content files parse. A broken fixture yields a readable error.
- `validate` rules (§3.1) run as a test too.
- `resolveScene`:
  - the default student loadout yields entries in the expected order. Snapshot the list of `(id, x, y)`: e.g. the junior monitor lands at x=182, y=56 (trimmed top-left).
  - Changing the desk moves surface children: with `senior.standing_desk` in the junior room, the monitor anchor = desk anchor + (2,−57).
  - Removing the desk is impossible (required). Removing the chair puts the character on the floor.
  - A socket missing on the parent → the child is skipped.
  - An invalid persisted item → falls back to the default.
- `sort`: the drawer pedestal is drawn after the desk; the rug before everything; the mouse after the keyboard mat; the character between the chair and its overlay.
- `computeView`: the table in §2.2 reproduced exactly, including fractional DPR 1.5 and 2.625, and portrait camera clamping.
- `hitTest`: a transparent pixel inside a bbox doesn't hit; an overlapping item resolves to the top-most entry.
- Character cut script: output sizes match §2.1 ±1 px; no alpha values other than 0/255; no pixel with `R>150 && G<60 && B>60` (magenta leftovers).

### 8.2 E2E (Playwright, Chromium + WebKit)

- `/debug?stage=<s>&scale=3&character=1` renders the world canvas only. Take a screenshot per stage and compare to the committed Playwright baselines.
- One-time check when first generated: the baselines must differ from `docs/art/expected_<stage>.png` by < 1 % of pixels (pixelmatch threshold 0.1). Differences come only from tiny character-cut rounding. Document any deviation.
- Page flows at 1440×900 DPR 2, 1366×768 DPR 1, iPhone 14 (portrait and landscape):
  - switch stage;
  - change the desk variant;
  - toggle the monitor off;
  - reload → the state persists;
  - Reset → defaults.
- Assert the canvas backing-store size equals `view × scale` with integer scale, and that `imageSmoothingEnabled` is false. Expose a `data-scale` attribute on the canvas.
- No console errors. Lighthouse a11y ≥ 95 on `/`.

### 8.3 Milestone 1 acceptance criteria

1. `pnpm dev` (port **4317**, `next dev -p 4317`) shows the student room by default, rendered from the native assets, pixel-crisp at an integer scale on desktop and phone.
2. The stage switcher shows student / junior / senior. Each room's default layout visually matches `docs/art/expected_<stage>.png`, with the character seated at the desk in every stage.
3. Every slot in the room can be switched among all accepted variants, and every optional slot can be toggled off.
   - Surface items follow the desk when the desk changes.
   - Changing the chair re-seats the character correctly. The backrest covers his back; head and shoulders stay visible.
   - With no chair, he sits on the floor.
4. Clicking an item in the scene selects its slot. Hover shows an outline.
5. Selections persist per stage across reloads. Reset restores defaults.
6. Portrait mobile shows the desk-centred crop with working pan. No layout overflow at 360 px width.
7. Loading, error and empty states are implemented.
8. `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e` pass. `pnpm assets:check` (atlas up-to-date + validate) passes.
9. `README.md` explains run, asset pipeline and the debug overlay. `docs/ART_TODO.md` lists the art issues from §2.3.
10. Deploys on Vercel with zero config: the atlas is committed, and there's no server code.

---

## 9. Step-by-step task list for the implementer

Commit after each step.

1. **Scaffold.**
   - `pnpm create next-app` (TypeScript, App Router, Tailwind, ESLint, `src/` dir, import alias `@/*`). Scaffold into `tmp-scaffold/` and move the files to the repo root, keeping `public/assets` and `docs`.
   - Set the `dev` script to `next dev -p 4317`.
   - Add `typecheck` (`tsc --noEmit`), `test` (vitest) and `test:e2e` (playwright).
   - `pnpm dlx shadcn@latest init`, then add `button tabs toggle-group sheet drawer switch scroll-area tooltip badge card skeleton separator`.
   - Add deps: `zustand zod`. Dev deps: `vitest @vitest/coverage-v8 jsdom @playwright/test pixelmatch pngjs sharp maxrects-packer tsx`.
2. **Config & types.** Create `src/game/config.ts` and `types.ts` per §2.2 and §5.
3. **Content.** Copy `docs/data-draft/*` to `src/game/content/` (rooms into `rooms/<id>.json`). Add `name`/`label` copy in English and Vietnamese. Example names:
   - "Folding table · Bàn xếp"
   - "Plastic stool · Ghế nhựa"
   - "Instant noodles · Mì ly"
   - "Ergonomic chair · Ghế công thái học"

   Then write the zod schema and `StaticContentSource`, plus unit tests.
4. **Asset scripts.**
   - `cut-character.ts`: port of `cut_pose`; compare against `docs/art/character_cut/`.
   - `build-atlas.ts` and `validate.ts`.
   - Scripts: `assets` (cut + build) and `assets:check` (build to temp + diff + validate).
   - Commit the generated `public/atlas/*` and `public/assets/character/derived/*`.
5. **Pure layout.** `resolveScene.ts` + `sort.ts`, following §2.2 items 4–6 and §2.4. Port the logic of `render()` in `docs/tools/render_preview.py`, which is the executable spec. Unit tests per §8.1.
6. **View math.** `computeView.ts` + `camera.ts` + tests (table in §2.2).
7. **Renderer.**
   - `atlas.ts`: load the image, frames and alpha buffer.
   - `canvasRenderer.ts`: offscreen 427×240 world → integer blit. Clip negative coords naturally via `drawImage`.
   - Outline highlight.
   - `hitTest.ts`.
8. **SceneCanvas.** ResizeObserver (device-pixel box), DPR change listener, pointer → world mapping, hover/click → store, drag-to-pan in portrait mode, `data-scale` attribute.
9. **Store.** Zustand + persist (`devlife:v1`, version 2), selectors, URL `?stage=` sync. Version 2 stores `totalMinutes` for the day/night clock.
10. **UI.** GameShell layout (desktop, mobile portrait, mobile landscape), StageSwitcher, CustomizePanel/SlotRow/ItemThumb, keyboard shortcuts, loading/error/empty states, a11y labels, the reduced-motion fade.
11. **Debug overlay and `/debug` route.** Use them to fine-tune every (tune) value. Write the final numbers back into the content JSON.
12. **E2E.** Playwright config (port 4317, `webServer`), flows and screenshot baselines. Do the one-time comparison with `docs/art/expected_*.png`.
13. **Docs.** Replace `README.md` (what it is, `pnpm i && pnpm dev`, open http://localhost:4317, asset pipeline, debug overlay, folder map). Create `docs/ART_TODO.md`.
14. **Vercel check.** `pnpm build && pnpm start` locally. Make sure `/debug` is excluded in prod and there are no `fs` reads at runtime.

Out of scope for M1: walking or animation, progression logic, unlocks, auth, Supabase, sound, i18n switching (store both strings; show English with Vietnamese subtitles where specified).

---

## 10. Day/night clock

The first game system. Full API and the subscriber guide: [`docs/systems/time.md`](systems/time.md).

- **1 in-game day = 10 real minutes** (`REAL_MS_PER_GAME_DAY` in `src/game/time/config.ts`). State is total in-game minutes. Day, `HH:MM`, and phase are derived.
- **Phases** (data, not hard-coded branches): `morning` Sáng 05:00–11:00, `noon` Trưa 11:00–17:00, `evening` Tối 17:00–22:00, `night` Khuya 22:00–05:00. The phase key is the icon key. Pixel icons are `public/ui/icons/icon_<key>.png` (44×44) and `_x4` (176×176). The HUD draws them at an integer scale; an emoji shows only if a file is missing.
- **HUD:** live `HH:MM` beside `Ngày N`, plus the phase icon and label. **Đi ngủ** is disabled during Sáng/Trưa and enabled (glowing) during Tối/Khuya. Sleep jumps to 06:00 the next day and emits `dayStarted` then `sleep`. Knowledge refills energy on both.
- **Room:** per-phase color wash on the canvas, crossfaded. The pixel grid is unchanged.
- **Loop:** one delta-time ticker, speed multiplier, pause. Large gaps (fast-forward, background tab) still emit every hour, phase, and day boundary.
- **Bus:** `minute`, `hourChanged`, `phaseChanged`, `dayStarted`, `sleep`. New systems subscribe; they do not edit the clock.
- **Debug** (`NODE_ENV !== "production"` or `?debug=1`): speed ×1 / ×10 / ×60, pause, jump to phase.
- **Save:** `devlife:v1` version 3. v1 saves gain `totalMinutes` at 08:00 on day 1. v2 saves keep that clock. v3 adds the career tables.

## 11. Knowledge and jobs

Study, ranks, and the freelance board. Rules: [`docs/systems/knowledge.md`](systems/knowledge.md) and [`docs/systems/jobs.md`](systems/jobs.md). Schema: [`docs/db/schema.sql`](db/schema.sql).

- **HUD:** **Học**, **Việc làm**, and **Kỹ năng** open lavender panels. Energy and money on the HUD come from the temporary vitals row. Health and mood stay stubbed.
- **Courses** spend money and energy, grant XP, and fast-forward the clock by the course hours.
- **Board** generates on `dayStarted` (and once on the first day, which does not emit that event). **Nhận** completes a freelance task immediately. Remote templates are stored and not offered.
- **Bus:** domain events (`skillXpGained`, `skillLevelUp`, `studyCompleted`, `jobBoardRefreshed`, `jobAccepted`, `jobCompleted`, `milestoneReached`, `moneyChanged`, `energyChanged`) go on `gameBus`. They do not extend `TimeEvent`.
- **Debug** (`NODE_ENV !== "production"` or `?debug=1`): add money, fill energy, level Frontend once.
