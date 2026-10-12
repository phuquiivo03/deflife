import { MIN_VIEW_W, PORTRAIT_SCENE_MAX_H, WORLD } from "../config";
import type { ViewState } from "../types";

export type ComputeViewInput = {
  areaCssW: number;
  areaCssH: number;
  dpr: number;
  portrait: boolean;
  focusX: number;
  cameraX: number | null;
};

export function computeView(input: ComputeViewInput): ViewState {
  const { areaCssW, areaCssH, dpr, portrait, focusX } = input;
  const devW = Math.floor(areaCssW * dpr);
  const devH = Math.floor(areaCssH * dpr);

  if (!portrait) {
    const scale = Math.max(
      1,
      Math.floor(Math.min(devW / WORLD.w, devH / WORLD.h)),
    );
    const viewW = WORLD.w;
    const viewH = WORLD.h;
    const cssW = (viewW * scale) / dpr;
    const cssH = (viewH * scale) / dpr;
    return {
      mode: "full",
      scale,
      viewW,
      viewH,
      cameraX: 0,
      cssW,
      cssH,
      dpr,
    };
  }

  const scale = Math.max(
    1,
    Math.min(
      Math.floor(devW / MIN_VIEW_W),
      Math.floor((PORTRAIT_SCENE_MAX_H * devH) / WORLD.h),
    ),
  );
  const viewW = Math.min(WORLD.w, Math.floor(devW / scale));
  const viewH = WORLD.h;
  const camera =
    input.cameraX !== null
      ? input.cameraX
      : focusX - Math.floor(viewW / 2);
  const cameraX = Math.max(0, Math.min(WORLD.w - viewW, Math.round(camera)));
  const cssW = (viewW * scale) / dpr;
  const cssH = (viewH * scale) / dpr;
  return {
    mode: "crop",
    scale,
    viewW,
    viewH,
    cameraX,
    cssW,
    cssH,
    dpr,
  };
}
