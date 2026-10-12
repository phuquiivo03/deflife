import { DEFAULT_LETTERBOX, WORLD } from "../config";
import type { DrawEntry, ViewState } from "../types";
import type { LoadedAtlas } from "./atlas";

export type Renderer = {
  setScene: (entries: DrawEntry[], backgroundUrl: string) => void;
  setView: (view: ViewState) => void;
  setHighlight: (slotId: string | null) => void;
  setDebug: (draw: DebugDraw | null) => void;
  destroy: () => void;
};

export type DebugDraw = {
  placements: { anchor: [number, number]; baseline: number }[];
  bounds?: { backWall: [number, number, number, number]; floorTopY: number };
};

export function createRenderer(
  canvas: HTMLCanvasElement,
  atlas: LoadedAtlas,
): Renderer {
  const world = document.createElement("canvas");
  world.width = WORLD.w;
  world.height = WORLD.h;
  const wctx = world.getContext("2d")!;
  wctx.imageSmoothingEnabled = false;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  let entries: DrawEntry[] = [];
  let bgUrl = "";
  let bgImg: HTMLImageElement | null = null;
  let view: ViewState | null = null;
  let highlight: string | null = null;
  let debug: DebugDraw | null = null;

  const loadBg = (url: string) => {
    bgUrl = url;
    const img = new Image();
    img.onload = () => {
      bgImg = img;
      paint();
    };
    img.src = url;
  };

  const drawFrame = (
    target: CanvasRenderingContext2D,
    sprite: string,
    dx: number,
    dy: number,
    src?: { x: number; y: number; w: number; h: number },
  ) => {
    const frame = atlas.getFrame(sprite);
    const { x, y, w, h } = frame.frame;
    if (src) {
      target.drawImage(
        atlas.image,
        x + src.x,
        y + src.y,
        src.w,
        src.h,
        dx,
        dy,
        src.w,
        src.h,
      );
    } else {
      target.drawImage(atlas.image, x, y, w, h, dx, dy, w, h);
    }
  };

  const paint = () => {
    if (!view) return;
    const { scale, viewW, viewH, cameraX, cssW, cssH, dpr } = view;
    canvas.width = viewW * scale;
    canvas.height = viewH * scale;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.dataset.scale = String(scale);

    wctx.clearRect(0, 0, WORLD.w, WORLD.h);
    if (bgImg) {
      wctx.drawImage(bgImg, 0, 0, WORLD.w, WORLD.h);
    }

    wctx.save();
    wctx.beginPath();
    wctx.rect(0, 0, WORLD.w, WORLD.h);
    wctx.clip();
    for (const e of entries) {
      drawFrame(
        wctx,
        e.sprite,
        e.x,
        e.y,
        e.srcW
          ? { x: e.srcX ?? 0, y: e.srcY ?? 0, w: e.srcW, h: e.srcH! }
          : undefined,
      );
    }
    wctx.restore();

    if (highlight) {
      for (const e of entries) {
        if (e.slotId !== highlight) continue;
        const frame = atlas.getFrame(e.sprite);
        const w = e.srcW ?? frame.frame.w;
        const h = e.srcH ?? frame.frame.h;
        wctx.strokeStyle = "#fff6d5";
        wctx.lineWidth = 1;
        wctx.strokeRect(e.x + 0.5, e.y + 0.5, w - 1, h - 1);
      }
    }

    if (debug) {
      wctx.strokeStyle = "rgba(255,0,0,0.5)";
      if (debug.bounds) {
        const [x0, y0, x1, y1] = debug.bounds.backWall;
        wctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        wctx.beginPath();
        wctx.moveTo(0, debug.bounds.floorTopY);
        wctx.lineTo(WORLD.w, debug.bounds.floorTopY);
        wctx.stroke();
      }
      for (const p of debug.placements) {
        wctx.strokeStyle = "#0ff";
        wctx.beginPath();
        wctx.moveTo(p.anchor[0] - 3, p.anchor[1]);
        wctx.lineTo(p.anchor[0] + 3, p.anchor[1]);
        wctx.moveTo(p.anchor[0], p.anchor[1] - 3);
        wctx.lineTo(p.anchor[0], p.anchor[1] + 3);
        wctx.stroke();
      }
    }

    ctx.fillStyle = DEFAULT_LETTERBOX;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      world,
      cameraX,
      0,
      viewW,
      viewH,
      0,
      0,
      viewW * scale,
      viewH * scale,
    );
  };

  return {
    setScene(next, backgroundUrl) {
      entries = next;
      if (backgroundUrl !== bgUrl) loadBg(backgroundUrl);
      else paint();
    },
    setView(v) {
      view = v;
      paint();
    },
    setHighlight(id) {
      highlight = id;
      paint();
    },
    setDebug(d) {
      debug = d;
      paint();
    },
    destroy() {
      entries = [];
    },
  };
}
