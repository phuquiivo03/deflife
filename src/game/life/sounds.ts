import { playCueKey } from "../audio/client";
import { CUE_KEYS, type CueKey } from "../audio/cues";
import type { LifeNotice } from "../career/types";

/** Life-sim cues. A successful store purchase plays `sfx_store_buy`. */
export const LIFE_SOUND_KEYS = [
  "sfx_notif_info",
  "sfx_notif_warn",
  "sfx_notif_urgent",
  "sfx_event_open",
  "sfx_landlord_knock",
  "sfx_salary",
  "sfx_store_buy",
  "sfx_diary_flip",
  "sfx_sick_cough",
] as const;

export type LifeSoundKey = (typeof LIFE_SOUND_KEYS)[number];

const CUE_FOR_LIFE: Record<LifeSoundKey, CueKey | null> = {
  sfx_notif_info: "notifInfo",
  sfx_notif_warn: "notifWarn",
  sfx_notif_urgent: "notifUrgent",
  sfx_event_open: "eventOpen",
  sfx_landlord_knock: "landlordKnock",
  sfx_salary: "salary",
  sfx_store_buy: "storeBuy",
  sfx_diary_flip: "diaryFlip",
  sfx_sick_cough: "sickCough",
};

const GENERIC_PINGS = new Set<CueKey>(["notifInfo", "notifWarn", "notifUrgent"]);

/**
 * When one tick asks for several cues, one wins.
 * A specific cue beats every severity ping. Two specifics use this order.
 */
const MOMENT_RANK: readonly CueKey[] = [
  "landlordKnock",
  "eventOpen",
  "sickCough",
  "salary",
  "storeBuy",
  "diaryFlip",
  "notifUrgent",
  "notifWarn",
  "notifInfo",
];

export function isSpecificCue(key: CueKey): boolean {
  return !GENERIC_PINGS.has(key);
}

function asCueKey(value: string | null | undefined): CueKey | null {
  if (!value) return null;
  return (CUE_KEYS as readonly string[]).includes(value) ? (value as CueKey) : null;
}

/** Severity ping, unless the notice carries a specific cue or an id rule. */
export function noticeCueKey(notice: Pick<LifeNotice, "id" | "severity"> & { cue?: string | null }): CueKey {
  const carried = asCueKey(notice.cue);
  if (carried && isSpecificCue(carried)) return carried;
  if (notice.id.startsWith("salary-")) return "salary";
  if (notice.id.startsWith("sick-")) return "sickCough";
  if (notice.id.includes("landlord_knock")) return "landlordKnock";
  if (notice.severity === "urgent") return "notifUrgent";
  if (notice.severity === "warn") return "notifWarn";
  return "notifInfo";
}

/** One cue for the tick. Identical cues collapse. A specific cue drops the pings. */
export function pickMomentCue(keys: readonly CueKey[]): CueKey | null {
  const unique: CueKey[] = [];
  const seen = new Set<CueKey>();
  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(key);
  }
  const specific = unique.filter(isSpecificCue);
  const pool = specific.length > 0 ? specific : unique;
  if (pool.length === 0) return null;
  let best = pool[0]!;
  let bestRank = rankOf(best);
  for (let i = 1; i < pool.length; i++) {
    const key = pool[i]!;
    const rank = rankOf(key);
    if (rank < bestRank) {
      best = key;
      bestRank = rank;
    }
  }
  return best;
}

function rankOf(key: CueKey): number {
  const index = MOMENT_RANK.indexOf(key);
  return index === -1 ? MOMENT_RANK.length : index;
}

/** Day-7 knock has its own cue. Every other dialog uses the open sting. */
export function dialogCueKey(eventId: string): CueKey {
  return eventId === "landlord_knock" ? "landlordKnock" : "eventOpen";
}

export function playLifeSound(key: LifeSoundKey): boolean {
  const cue = CUE_FOR_LIFE[key];
  if (!cue) return false;
  playCueKey(cue);
  return true;
}
