import sliceDoc from "../../../public/ui/m5_1/slices.json";
import { BUTTON_UI_SCALE, buttonMetrics, type ButtonScale } from "@/components/ui/button/config";
import type { NoticeAction } from "@/game/career/types";

/**
 * Thông báo panel metrics. The badge size comes from
 * `public/ui/m5_1/slices.json` (`ui_badge_unread_lg`). Distances the art
 * file does not spell out live here and in `docs/systems/notifications.md`.
 */

type BadgeSlice = {
  size: [number, number];
  note: string;
};

const badgeSlice = sliceDoc.ui_badge_unread_lg as BadgeSlice;

if (!badgeSlice || badgeSlice.size[0] !== 16 || badgeSlice.size[1] !== 16) {
  throw new Error("public/ui/m5_1/slices.json ui_badge_unread_lg must be 16×16");
}

export const NOTICE_BADGE_KEY = "ui_badge_unread_lg";

/** Native pixels. The panel draws this sheet at 1×, so the disc is 16 CSS px. */
export const NOTICE_BADGE_NATIVE_PX = badgeSlice.size[0];

/**
 * 1× keeps the count badge at the spec size (~16 CSS px).
 * The `_x2` sheet is shipped beside it and is not used at this size.
 */
export const NOTICE_BADGE_SCALE = 1 as const;

/** Galmuri7 at 1×. This is the integer size that fits inside the 16px disc. */
export const NOTICE_BADGE_COUNT_PX = 8;

/** Digits drawn in the disc. A larger unread count still shows this cap. */
export const NOTICE_BADGE_COUNT_CAP = 9;

/** Opacity pulse on the unread disc. `prefers-reduced-motion` holds it still. */
export const NOTICE_BADGE_PULSE_MS = 1600;

/** Lowest opacity of that pulse. 1 is fully the red disc. */
export const NOTICE_BADGE_PULSE_OPACITY = 0.75;

/** Native size of every `icon_action_*` glyph. */
export const NOTICE_ACTION_ICON_NATIVE_PX = 16;

/**
 * Compact row. Padding was 12px, the row icon was drawn at 32px, and the
 * message was Galmuri9 at 20px. Copy now uses Galmuri7 at 16px and clamps
 * to two lines (a short line stays on one).
 */
export const NOTICE_LIST = {
  paddingPx: 8,
  gapPx: 8,
  listGapPx: 6,
  rowIconPx: 16,
  textPx: 16,
  linePx: 16,
  lines: 2,
} as const;

/** Labels the old text buttons showed. Icon buttons keep these as the accessible name. */
export const NOTICE_ACTION_LABELS = {
  payRent: "Trả trọ",
  viewJobs: "Xem job",
  openStore: "Mở store",
  eat: "Đi ăn",
  sleep: "Đi ngủ",
} as const satisfies Record<NoticeAction | "eat" | "sleep", string>;

/**
 * Spec glyphs. `eat` and `sleep` are mapped here; the notice schema does not
 * emit them. A labeled action with no entry falls back to the text button.
 */
export const NOTICE_ACTION_ICONS = {
  payRent: "icon_action_pay_rent",
  viewJobs: "icon_action_view_job",
  openStore: "icon_action_open_store",
  eat: "icon_action_eat",
  sleep: "icon_action_sleep",
} as const satisfies Record<keyof typeof NOTICE_ACTION_LABELS, string>;

export type NoticeActionIconKey = (typeof NOTICE_ACTION_ICONS)[keyof typeof NOTICE_ACTION_ICONS];

export type NoticeActionControl =
  | { kind: "icon"; label: string; iconKey: NoticeActionIconKey }
  | { kind: "text"; label: string };

export function noticeBadgeFile(scale: 1 | 2 = NOTICE_BADGE_SCALE): string {
  return scale === 2 ? `${NOTICE_BADGE_KEY}_x2.png` : `${NOTICE_BADGE_KEY}.png`;
}

export function noticeBadgeMetrics(scale: 1 | 2 = NOTICE_BADGE_SCALE) {
  const sizePx = NOTICE_BADGE_NATIVE_PX * scale;
  return {
    scale,
    sizePx,
    countPx: NOTICE_BADGE_COUNT_PX * scale,
  };
}

export function actionIconFile(key: NoticeActionIconKey, scale: 1 | 2 = 1): string {
  return scale === 2 ? `${key}_x2.png` : `${key}.png`;
}

/**
 * The icon-button face is the shared 9-slice at 2×. Its center is 16 CSS px,
 * which matches the native action glyph, so the button stays the 48px face
 * and the glyph is the native sheet.
 */
export function noticeActionButtonMetrics(scale: ButtonScale = BUTTON_UI_SCALE) {
  const frame = buttonMetrics(scale);
  const centerPx = frame.iconPx - frame.slicePx * 2;
  return {
    scale,
    buttonPx: frame.iconPx,
    centerPx,
    glyphPx: centerPx,
  };
}

export function resolveNoticeAction(
  action: string,
  icons: Readonly<Partial<Record<string, NoticeActionIconKey>>> = NOTICE_ACTION_ICONS,
): NoticeActionControl | null {
  const label = NOTICE_ACTION_LABELS[action as keyof typeof NOTICE_ACTION_LABELS];
  if (!label) return null;
  const iconKey = icons[action];
  if (!iconKey) return { kind: "text", label };
  return { kind: "icon", label, iconKey };
}

/** Custom properties for the list, the rows, and the unread disc. */
export function noticeChromeStyle(): Record<`--${string}`, string> {
  const badge = noticeBadgeMetrics();
  return {
    "--notice-pad": `${NOTICE_LIST.paddingPx}px`,
    "--notice-gap": `${NOTICE_LIST.gapPx}px`,
    "--notice-list-gap": `${NOTICE_LIST.listGapPx}px`,
    "--notice-icon": `${NOTICE_LIST.rowIconPx}px`,
    "--notice-text": `${NOTICE_LIST.textPx}px`,
    "--notice-line": `${NOTICE_LIST.linePx}px`,
    "--notice-lines": String(NOTICE_LIST.lines),
    "--notice-badge": `${badge.sizePx}px`,
    "--notice-badge-count": `${badge.countPx}px`,
    "--notice-badge-pulse": `${NOTICE_BADGE_PULSE_MS}ms`,
    "--notice-badge-dim": String(NOTICE_BADGE_PULSE_OPACITY),
  };
}
