import type { AtlasFrame } from "../types";
import type { DrawEntry } from "../types";

export function hitTestEntries(
  entries: DrawEntry[],
  worldX: number,
  worldY: number,
  getFrame: (sprite: string) => AtlasFrame,
  alphaBySprite: Map<string, Uint8ClampedArray>,
): string | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e.hitTest || !e.slotId) continue;
    const frame = getFrame(e.sprite);
    const w = e.srcW ?? frame.frame.w;
    const h = e.srcH ?? frame.frame.h;
    const lx = worldX - e.x;
    const ly = worldY - e.y;
    if (lx < 0 || ly < 0 || lx >= w || ly >= h) continue;
    const alpha = alphaBySprite.get(e.sprite);
    if (!alpha) continue;
    const a = alpha[ly * w + lx];
    if (a > 127) return e.slotId;
  }
  return null;
}
