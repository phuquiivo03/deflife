import lifeEvents from "../../../config/life_events.json";
import type { StageId } from "../config";
import type { PhaseId } from "../time/config";

export type LifeChoice = {
  id: string;
  text: string;
  money?: number;
  energy?: number;
  health?: number;
  mood?: number;
  reputation?: number;
  softXp?: number;
  bugDelta?: number;
  bugChance?: number;
  repChance?: number;
  repChanceAmount?: number;
  loseSlot?: boolean;
  setFlags?: string[];
  joinHackathon?: boolean;
  payRent?: boolean;
  recoverPayRatio?: number;
  quotePayRatio?: number;
};

export type LifeEventDef = {
  id: string;
  stages: StageId[];
  phases: PhaseId[];
  weight: number;
  good: boolean;
  kind: "choice" | "buff";
  portrait: string | null;
  icon: string;
  text: string;
  flagAbsent?: string;
  friday?: boolean;
  choices: LifeChoice[];
};

export type LifeEventsConfig = {
  roll_p: number;
  pity_step: number;
  pity_cap: number;
  cooldown_days: number;
  good_mood_below: number;
  good_weight: number;
  bubble_ms: number;
  banner_ms: number;
  soft_xp: number;
  hackathon_base: number;
  hackathon_per_level: number;
  hackathon_prize: number;
  hackathon_xp: number;
  notice_cap: number;
  diary_lines: string[];
  holiday_labels: Record<string, string>;
  events: LifeEventDef[];
  stories: LifeEventDef[];
};

export const LIFE_EVENTS = lifeEvents as LifeEventsConfig;

const byId = new Map<string, LifeEventDef>(
  [...LIFE_EVENTS.events, ...LIFE_EVENTS.stories].map((event) => [event.id, event]),
);

export function lifeEventById(id: string): LifeEventDef | null {
  return byId.get(id) ?? null;
}

export function holidayLabel(id: string): string {
  return LIFE_EVENTS.holiday_labels[id] ?? id;
}
