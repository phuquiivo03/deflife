import type { DrawEntry } from "../types";

export function compareDrawEntries(a: DrawEntry, b: DrawEntry): number {
  if (a.layer !== b.layer) return a.layer - b.layer;
  if (a.sortBaseline !== b.sortBaseline) return a.sortBaseline - b.sortBaseline;
  const subA = a.sortSub;
  const subB = b.sortSub;
  if (typeof subA === "number" && typeof subB === "number") {
    return subA - subB;
  }
  const ta = Array.isArray(subA) ? subA : [subA, 0, 0];
  const tb = Array.isArray(subB) ? subB : [subB, 0, 0];
  for (let i = 0; i < 3; i++) {
    const d = (ta[i] ?? 0) - (tb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function sortDrawEntries(entries: DrawEntry[]): DrawEntry[] {
  return [...entries].sort(compareDrawEntries);
}
