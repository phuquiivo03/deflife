/**
 * Chrome tooltip timing and placement.
 * Documented in docs/design/DESIGN_SYSTEM.md (Tooltips).
 * Focus and touch open immediately; only fine-pointer hover waits.
 */
export const TOOLTIP = {
  /** Hover delay on a fine pointer, in milliseconds. */
  openDelayMs: 300,
  /** After one tip closes, the next tip in the same provider skips the hover delay for this long. */
  skipDelayMs: 120,
  /** Gap between the trigger and the tip, in CSS pixels. */
  sideOffsetPx: 8,
  /** Viewport inset before the tip flips to stay on screen, in CSS pixels. */
  collisionPaddingPx: 8,
  /** Fade and slide length. `prefers-reduced-motion` skips the animation. */
  enterMs: 120,
  /**
   * The tip has no interactive content, so leaving the trigger closes it.
   * A hoverable tip would stay open until the pointer moved again.
   */
  disableHoverableContent: true,
} as const;
