import type { CareerState, LifeNotice } from "../career/types";
import { LIFE } from "./content";
import { LIFE_EVENTS } from "./events-content";

export type HungerId = "full" | "peckish" | "hungry";

const LABEL: Record<HungerId, string> = {
  full: "No",
  peckish: "Hơi đói",
  hungry: "Đói",
};

export function hungerLevel(slots: number, fullUntil = LIFE.hunger_full_until, peckishUntil = LIFE.hunger_peckish_until): HungerId {
  const safe = Number.isFinite(slots) ? Math.max(0, Math.trunc(slots)) : 0;
  if (safe <= fullUntil) return "full";
  if (safe <= peckishUntil) return "peckish";
  return "hungry";
}

export function hungerLabel(level: HungerId): string {
  return LABEL[level];
}

/** One waking slot since the last meal. Đói pushes one reminder per meal stretch. */
export function advanceHunger(state: CareerState): CareerState {
  const life = state.life;
  if (!life) return state;
  const slots = Math.max(0, Math.trunc(life.slotsSinceMeal ?? 0)) + 1;
  const next: CareerState = { ...state, life: { ...life, slotsSinceMeal: slots } };
  if (hungerLevel(slots) !== "hungry" || !next.feed) return next;
  const id = `hunger-${next.players.game_day}-${next.life.mealsToday}`;
  if (next.feed.notices.some((notice) => notice.id === id)) return next;
  const notice: LifeNotice = {
    id,
    day: next.players.game_day,
    minute: next.players.game_minute,
    severity: "warn",
    icon: "icon_notif_event.png",
    text: LIFE.hunger_notice,
    action: null,
    read: false,
  };
  const notices = [...next.feed.notices, notice];
  const cap = LIFE_EVENTS.notice_cap;
  return {
    ...next,
    feed: { ...next.feed, notices: notices.length > cap ? notices.slice(notices.length - cap) : notices },
  };
}
