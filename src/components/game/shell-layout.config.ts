/**
 * Desktop side panels. Documented in docs/design/DESIGN_SYSTEM.md (Layout).
 * Below `desktopMinPx` the columns stay in normal flow and scroll with the page.
 */

export const SHELL_LAYOUT = {
  /**
   * Tailwind `lg`. The CSS module media query uses this same pixel value.
   * Narrower viewports keep the room → HUD → panels stack.
   */
  desktopMinPx: 1024,
  /** Header block. Matches `min-h-14` on the shell header (border included). */
  headerPx: 56,
  /**
   * Top and bottom inset. Matches `lg:py-6` on the scrolling region.
   * Sticky `top` stays 0: that padding is already the inset, and a second
   * offset would stack on it.
   */
  marginYPx: 24,
  stickyTopPx: 0,
  /**
   * Panel stack. The holiday banner is `z-30`, and modal backdrops,
   * popups, and tooltips start at 40. Panels stay under that floor so a
   * banner can paint across them.
   */
  panelZ: 1,
  /** Lowest overlay the panels must stay under. The banner uses this. */
  overlayFloorZ: 30,
} as const;

/** `100vh` minus the header and both vertical margins. */
export function shellPanelMaxHeight(layout = SHELL_LAYOUT): string {
  const reserved = layout.headerPx + layout.marginYPx * 2;
  return `calc(100vh - ${reserved}px)`;
}

/** Custom properties consumed by `shell-layout.module.css` at the desktop breakpoint. */
export function shellPanelVars(layout = SHELL_LAYOUT): Record<`--${string}`, string> {
  return {
    "--shell-panel-top": `${layout.stickyTopPx}px`,
    "--shell-panel-max": shellPanelMaxHeight(layout),
    "--shell-panel-z": String(layout.panelZ),
  };
}
