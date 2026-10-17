import { playCueKey } from "../audio/client";
import type { CueKey } from "../audio/cues";
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

/** Severity ping, unless the notice has its own cue. */
export function noticeCueKey(notice: Pick<LifeNotice, "id" | "severity">): CueKey {
  if (notice.id.startsWith("salary-")) return "salary";
  if (notice.id.startsWith("sick-")) return "sickCough";
  if (notice.id.includes("landlord_knock")) return "landlordKnock";
  if (notice.severity === "urgent") return "notifUrgent";
  if (notice.severity === "warn") return "notifWarn";
  return "notifInfo";
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
