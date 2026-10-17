import traitsConfig from "../../../config/traits.json";
import { TRAIT_IDS, type CareerState, type SkillId, type TraitId, type XpSource } from "../career/types";
import type { M5AssetKey } from "./assets";
import { LIFE } from "./content";

export type { TraitId };
export { TRAIT_IDS };

export type TraitDef = {
  id: TraitId;
  name: string;
  bonus: string;
  penalty: string;
  icon: M5AssetKey;
  xp_multiplier?: number;
  morning_energy?: number;
  study_xp_multiplier?: number;
  mood_decay?: number;
  soft_xp_multiplier?: number;
  pay_multiplier?: number;
  home_days?: number;
  home_mood?: number;
  food_multiplier?: number;
  shop_mood_multiplier?: number;
  bug_delta?: number;
  job_time_multiplier?: number;
  mood_floor?: number;
};

type TraitConfig = {
  migration_trait: TraitId;
  extrovertHomePenalty: boolean;
  night_from_minute: number;
  night_until_minute: number;
  traits: TraitDef[];
};

const TRAITS = traitsConfig as TraitConfig;

export const MIGRATION_TRAIT: TraitId = isTraitId(TRAITS.migration_trait)
  ? TRAITS.migration_trait
  : "careful";

const BY_ID = new Map<TraitId, TraitDef>(TRAITS.traits.map((trait) => [trait.id, trait]));

export function isTraitId(value: unknown): value is TraitId {
  return typeof value === "string" && (TRAIT_IDS as readonly string[]).includes(value);
}

export function traitOf(state: CareerState): TraitId {
  return isTraitId(state.players.trait) ? state.players.trait : MIGRATION_TRAIT;
}

export function traitDef(id: TraitId): TraitDef {
  return BY_ID.get(id) ?? BY_ID.get(MIGRATION_TRAIT)!;
}

/** One trait for a new character, or the single migration roll. */
export function rollTrait(random: () => number = Math.random): TraitId {
  const index = Math.min(TRAIT_IDS.length - 1, Math.max(0, Math.floor(random() * TRAIT_IDS.length)));
  return TRAIT_IDS[index] ?? MIGRATION_TRAIT;
}

export function isNightOwlHour(minuteOfDay: number): boolean {
  const minute = ((minuteOfDay % (24 * 60)) + 24 * 60) % (24 * 60);
  return minute >= TRAITS.night_from_minute || minute < TRAITS.night_until_minute;
}

/** Study and job XP only. Events and debug XP skip this. Furniture is applied by the caller after. */
export function scaleTraitXp(
  amount: number,
  state: CareerState,
  skillId: SkillId,
  source: XpSource,
): number {
  if (!(amount > 0)) return 0;
  const trait = traitDef(traitOf(state));
  let factor = 1;
  if (trait.id === "diligent" && source === "study" && trait.study_xp_multiplier != null) {
    factor = trait.study_xp_multiplier;
  } else if (trait.id === "extrovert" && skillId === "soft" && trait.soft_xp_multiplier != null) {
    factor = trait.soft_xp_multiplier;
  } else if (trait.id === "night_owl" && isNightOwlHour(state.players.game_minute) && trait.xp_multiplier != null) {
    factor = trait.xp_multiplier;
  } else if (trait.id === "optimist" && trait.xp_multiplier != null) {
    factor = trait.xp_multiplier;
  }
  if (factor === 1) return Math.floor(amount);
  return Math.floor(amount * factor);
}

export function traitMorningEnergy(state: CareerState): number {
  const trait = traitDef(traitOf(state));
  return trait.id === "night_owl" ? (trait.morning_energy ?? 0) : 0;
}

export function traitDecay(state: CareerState): number {
  const trait = traitDef(traitOf(state));
  return trait.id === "diligent" && trait.mood_decay != null ? trait.mood_decay : LIFE.trait_decay;
}

/** Home-day mood. `extrovertHomePenalty` turns the Hướng ngoại cost on or off. */
export function extrovertHomeMood(enabled: boolean, trait: TraitId, homeDays: number): number {
  if (!enabled || trait !== "extrovert") return 0;
  const def = traitDef("extrovert");
  if (def.home_days == null || def.home_mood == null) return 0;
  return homeDays >= def.home_days ? def.home_mood : 0;
}

export function traitHomeMood(state: CareerState, homeDays: number): number {
  return extrovertHomeMood(TRAITS.extrovertHomePenalty, traitOf(state), homeDays);
}

/** Character card uses the 32×32 sheet so the pixels stay 1:1. */
export function traitIconSrc(icon: M5AssetKey): string {
  return `/ui/m5/${icon.replace(/\.png$/, "_x2.png")}`;
}

/** Bonus line. The home penalty stays off the card while that flag is false. */
export function traitDetail(trait: TraitDef): string {
  if (trait.id === "extrovert" && !TRAITS.extrovertHomePenalty) return trait.bonus;
  return `${trait.bonus} · ${trait.penalty}`;
}

export function foodPrice(price: number, state: CareerState): number {
  if (!(price > 0)) return 0;
  const trait = traitDef(traitOf(state));
  if (trait.id !== "frugal" || trait.food_multiplier == null) return price;
  return Math.max(0, Math.round(price * trait.food_multiplier));
}

/** Positive mood from a store purchase. Tiết kiệm halves it. */
export function scaleShoppingMood(mood: number, state: CareerState): number {
  if (!(mood > 0)) return mood;
  const trait = traitDef(traitOf(state));
  if (trait.id !== "frugal" || trait.shop_mood_multiplier == null) return mood;
  return mood * trait.shop_mood_multiplier;
}

/** Freelance payout after the pay formula. Monthly salary is unchanged. */
export function scaleTraitPay(pay: number, state: CareerState): number {
  const trait = traitDef(traitOf(state));
  if (trait.id !== "extrovert" || trait.pay_multiplier == null) return pay;
  return Math.max(0, Math.round(pay * trait.pay_multiplier));
}

export function traitMoodFloor(state: CareerState): number | null {
  const trait = traitDef(traitOf(state));
  return trait.id === "optimist" && trait.mood_floor != null ? trait.mood_floor : null;
}

export function traitBugCount(count: number, state: CareerState, bounds: { min: number; max: number }): number {
  const trait = traitDef(traitOf(state));
  if (trait.id !== "careful" || trait.bug_delta == null) return count;
  const min = Math.min(bounds.min, bounds.max);
  const max = Math.max(bounds.min, bounds.max);
  return Math.max(min, Math.min(max, count + trait.bug_delta));
}

export function traitJobHours(hours: number, state: CareerState): number {
  const trait = traitDef(traitOf(state));
  if (trait.id !== "careful" || trait.job_time_multiplier == null) return hours;
  return Math.round(hours * trait.job_time_multiplier * 10) / 10;
}

/** CRT phase lengths. 1 for every trait except Cẩn thận. */
export function jobTimeScale(state: CareerState): number {
  const trait = traitDef(traitOf(state));
  return trait.id === "careful" && trait.job_time_multiplier != null ? trait.job_time_multiplier : 1;
}
