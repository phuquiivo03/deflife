import type { Localized } from "@/game/types";

export const DEFAULT_LOCALE = "vi" as const;

export type AppLocale = "vi" | "en";

/** Resolve localized copy; Vietnamese is the default UI locale. */
export function t(text: Localized | string | undefined | null): string {
  if (text == null) return "";
  if (typeof text === "string") return text;
  return text[DEFAULT_LOCALE] ?? text.en;
}
