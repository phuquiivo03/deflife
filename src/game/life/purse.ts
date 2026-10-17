import type { CareerState, DiaryPurse } from "../career/types";

export type PurseKind = "earn" | "food" | "rent" | "shop" | "other";

export function emptyPurse(): DiaryPurse {
  return { earned: 0, food: 0, rent: 0, shop: 0, other: 0 };
}

/** Record one money change for the sleep diary. Positive amounts count as earned. */
export function notePurse(state: CareerState, delta: number, kind: PurseKind): CareerState {
  const amount = Math.trunc(delta);
  if (!amount || !state.feed) return state;
  const purse: DiaryPurse = { ...emptyPurse(), ...state.feed.purse };
  if (amount > 0) purse.earned += amount;
  else if (kind === "food" || kind === "rent" || kind === "shop") purse[kind] += -amount;
  else purse.other += -amount;
  return { ...state, feed: { ...state.feed, purse } };
}

/**
 * Split the day into earned and spent. A gap versus the morning snapshot
 * (an older save, or a change that was not tagged) is folded in so the
 * lines still add up to the money that is left.
 */
export function diaryBooks(startMoney: number, endMoney: number, purse: DiaryPurse | undefined) {
  const base = { ...emptyPurse(), ...purse };
  let earned = base.earned;
  let other = base.other;
  const { food, rent, shop } = base;
  const explained = startMoney + earned - (food + rent + shop + other);
  const gap = endMoney - explained;
  if (gap > 0) earned += gap;
  else if (gap < 0) other += -gap;
  return {
    earned,
    spent: food + rent + shop + other,
    food,
    rent,
    shop,
    remaining: endMoney,
    money: endMoney - startMoney,
  };
}
