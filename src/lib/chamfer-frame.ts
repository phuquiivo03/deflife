import type { CSSProperties } from "react";

/** Chamfer frame geometry at 427px room width (prototype reference). */
export const CHAMFER_BASE_ROOM_W = 427;

export type ChamferLayer = {
  cornerPx: number;
  paddingPx: number;
};

export const CHAMFER_LAYERS = {
  f1: { cornerPx: 16, paddingPx: 3 },
  f2: { cornerPx: 14, paddingPx: 3 },
  f3: { cornerPx: 12, paddingPx: 7 },
  f4: { cornerPx: 8, paddingPx: 2 },
  f5: { cornerPx: 6, paddingPx: 0 },
  plate: { cornerPx: 6, paddingPx: 0 },
} as const;

export function chamferScale(roomWidthPx: number): number {
  return Math.max(0.75, roomWidthPx / CHAMFER_BASE_ROOM_W);
}

export function scaledChamfer(
  layer: ChamferLayer,
  scale: number,
): { corner: number; padding: number } {
  return {
    corner: layer.cornerPx * scale,
    padding: layer.paddingPx * scale,
  };
}

export function chamferClipStyle(cornerPx: number): CSSProperties {
  const c = `${cornerPx}px`;
  return {
    clipPath: `polygon(${c} 0, calc(100% - ${c}) 0, 100% ${c}, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, ${c} 100%, 0 calc(100% - ${c}), 0 ${c})`,
  };
}
