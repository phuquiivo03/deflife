import fs from "node:fs";
import path from "node:path";

const ICONS_DIR = path.join(process.cwd(), "public", "ui", "icons");

/**
 * Filenames currently in `public/ui/icons`. Read on each server render so
 * adding `icon_<key>.png` (and the `_x4` pair) shows up on refresh.
 */
export function listUiIconFiles(): string[] {
  try {
    return fs
      .readdirSync(ICONS_DIR)
      .filter((name) => name.startsWith("icon_") && name.endsWith(".png"))
      .sort();
  } catch {
    return [];
  }
}
