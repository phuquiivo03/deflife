/** Temporary money + energy until the stats system replaces this module. */

export function clampEnergy(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, value));
}

export function applyMoney(money: number, delta: number): number {
  const next = money + delta;
  if (!Number.isFinite(next)) return money;
  return Math.trunc(next);
}

export function applyEnergy(energy: number, delta: number, max: number): number {
  return clampEnergy(energy + delta, max);
}
