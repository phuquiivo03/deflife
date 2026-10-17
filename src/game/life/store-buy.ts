import type { CareerState } from "../career/types";
import type { StageId } from "../config";
import type { GameEvent } from "../events/types";
import { buyBlock, shopOf, STORE, storeItem, storePrice } from "./furniture";
import { applyActionStats } from "./logic";
import { scaleShoppingMood } from "./traits";

export type BuyResult = {
  state: CareerState;
  events: GameEvent[];
  skipDays: number;
  error: string | null;
  moveTo: StageId | null;
};

export function buyShopItem(state: CareerState, id: string): BuyResult {
  const error = buyBlock(state, id);
  const item = storeItem(id);
  if (error || !item) {
    return { state, events: [], skipDays: 0, error: error ?? "Không có món này.", moveTo: null };
  }
  const price = storePrice(item, state.players.game_day);
  const grant = item.stage ? STORE.room_purchase_mood : STORE.purchase_mood;
  const mood = scaleShoppingMood(grant, state);
  const spent = applyActionStats(state, { money: -price, mood });
  const shop = shopOf(spent.state);
  const moveTo = item.stage ?? null;
  const next: CareerState = {
    ...spent.state,
    shop: { ...shop, owned: [...shop.owned, item.id] },
    players: {
      ...spent.state.players,
      stage: moveTo ?? spent.state.players.stage,
    },
  };
  return { state: next, events: spent.events, skipDays: spent.skipDays, error: null, moveTo };
}
