import { WORLD } from "../config";

export function clampCameraX(
  cameraX: number,
  viewW: number,
  worldW = WORLD.w,
): number {
  const maxX = Math.max(0, worldW - viewW);
  return Math.max(0, Math.min(maxX, Math.round(cameraX)));
}

export function focusCameraX(focusX: number, viewW: number, worldW = WORLD.w): number {
  return clampCameraX(focusX - Math.floor(viewW / 2), viewW, worldW);
}
