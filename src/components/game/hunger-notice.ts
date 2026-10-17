import type { LifeNotice } from "@/game/career/types";

/**
 * True when a row is the Đói reminder from `advanceHunger`.
 *
 * That writer is the only one that sets action `eat`. Its id is
 * `hunger-<day>-<mealsToday>`. `LifeNotice` has no kind, type, or source.
 * The icon and severity are shared with other rows, so they are not used.
 * Either stable field is enough: action `eat` still matches if the id
 * format changes, and the id prefix still matches if the action was cleared.
 * The low Sức khỏe row is action `sleep` with id `sick-<day>`.
 */
export function isHungerNotice(notice: Pick<LifeNotice, "id" | "action">): boolean {
  return notice.action === "eat" || notice.id.startsWith("hunger-");
}
