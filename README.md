# devlife

A cozy 2D pixel-art developer life-sim for the web: a Vietnamese dev's journey from student to junior to senior, told through the room they work in.

**Status: planning.** No app code yet. Milestone 1 (one room scene, stage switching, furniture swapping, a seated character) is specified in [`docs/PLAN.md`](docs/PLAN.md).

## What's here

- `public/assets/` holds the runtime art:
  - rooms (427×240 native);
  - v2 furniture sprites and shadows;
  - the character sheet;
  - furnished reference layouts.
- `docs/PLAN.md` covers the scale & coordinate system, rendering approach, data model, UI and a step-by-step task list.
- `docs/data-draft/` has draft content JSON (items, room slots and anchors) measured from the provided composites.
- `docs/tools/render_preview.py` is an offline reference renderer that implements the plan's draw rules. It writes target images to `docs/art/expected_*.png`:
  ```bash
  pip install pillow numpy
  python3 docs/tools/render_preview.py
  ```
- `docs/art/` holds asset diagnostics: composites, the mismatch report, v1 originals and scale studies.

Planned stack: Next.js (App Router, TypeScript), Tailwind, shadcn/ui, Canvas2D renderer, Zustand. Deploys on Vercel; Supabase comes later.
