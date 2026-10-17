/**
 * Declared so later phases can call them. No files are loaded: every key no-ops
 * until Art/Sound delivers ogg+mp3 and the manifest lists them.
 */
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

export function playLifeSound(key: LifeSoundKey): boolean {
  void key;
  return false;
}
