import { MODAL } from "@/components/ui/modal.config";
import { SHELL_LAYOUT } from "./shell-layout.config";

/**
 * Event choice card on the room canvas.
 * Documented in docs/design/DESIGN_SYSTEM.md (Event popup)
 * and docs/systems/life.md.
 *
 * The card is anchored to the lower edge of the canvas. There is no
 * dimmed backdrop. `zIndex` sits above the side panels and below the
 * holiday banner, modals, and tooltips. `prefers-reduced-motion`
 * skips the fade and rise.
 */
export const LIFE_EVENT_POPUP = {
  /** Card width at the desktop canvas, CSS pixels. Narrower canvases scale it down. */
  widthPx: 424,
  /** Card height at that width, CSS pixels. The ratio is kept when the card shrinks. */
  heightPx: 186,
  /** Gap between the card and the canvas edge, CSS pixels. */
  insetPx: 8,
  /**
   * Above the canvas and the side panels (`SHELL_LAYOUT.panelZ`),
   * below the holiday banner (`overlayFloorZ`), modal backdrops,
   * and tooltips (`MODAL.overlayZ`).
   */
  zIndex: 20,
  /** Fade and rise. `prefers-reduced-motion` skips it. */
  enterMs: 160,
  /** How far the card rises while it fades in, CSS pixels. */
  risePx: 4,
  /** Rose edge, same family as the side-panel frame. */
  border: "#E3B4D8",
} as const;

export function lifeEventPopupStyle(): Record<`--${string}`, string> & { zIndex: number } {
  return {
    zIndex: LIFE_EVENT_POPUP.zIndex,
    "--event-popup-z": String(LIFE_EVENT_POPUP.zIndex),
    "--event-popup-w": `${LIFE_EVENT_POPUP.widthPx}px`,
    "--event-popup-h": `${LIFE_EVENT_POPUP.heightPx}px`,
    "--event-popup-inset": `${LIFE_EVENT_POPUP.insetPx}px`,
    "--event-popup-enter": `${LIFE_EVENT_POPUP.enterMs}ms`,
    "--event-popup-rise": `${LIFE_EVENT_POPUP.risePx}px`,
    "--event-popup-border": LIFE_EVENT_POPUP.border,
  };
}

/** Layer check used by tests: panels underneath, banner and modals above. */
export function lifeEventPopupLayerOk(
  popup = LIFE_EVENT_POPUP,
  shell = SHELL_LAYOUT,
  modal = MODAL,
): boolean {
  return popup.zIndex > shell.panelZ && popup.zIndex < shell.overlayFloorZ && popup.zIndex < modal.overlayZ;
}
