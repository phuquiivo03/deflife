/** Pixel UI assets from the art agent (44×44 icons, 48×48 framed avatars; ×4 variants). */

export const ICON_NATIVE_PX = 44;
export const ICON_X4_PX = 176;
export const AVATAR_NATIVE_PX = 48;
export const AVATAR_X4_PX = 192;

export type IconName =
  | "health"
  | "mood"
  | "energy"
  | "burnout"
  | "clock"
  | "level"
  | "job"
  | "reputation"
  | "stars"
  | "relationship"
  | "frontend"
  | "backend"
  | "devops"
  | "algorithms"
  | "english"
  | "communication"
  | "balance"
  | "salary"
  | "rent"
  | "food"
  | "savings"
  | "debt"
  | "skill_up";

export type FramedAvatarRole =
  | "player"
  | "boss"
  | "tech_lead"
  | "coworker_male"
  | "designer"
  | "partner"
  | "hr";

/**
 * Pick icon file + CSS size so the bitmap is scaled by an integer factor only.
 */
export function resolveIconAsset(
  name: IconName | string,
  requestedSize: number,
): { src: string; displayPx: number } {
  const want = Math.max(1, Math.round(requestedSize));

  for (let delta = 0; delta <= 8; delta++) {
    for (const candidate of delta === 0 ? [want] : [want - delta, want + delta]) {
      if (candidate < 1) continue;
      if (ICON_X4_PX % candidate === 0) {
        return {
          src: `/ui/icons/icon_${name}_x4.png`,
          displayPx: candidate,
        };
      }
      if (ICON_NATIVE_PX % candidate === 0) {
        return {
          src: `/ui/icons/icon_${name}.png`,
          displayPx: candidate,
        };
      }
      if (candidate % ICON_NATIVE_PX === 0) {
        return {
          src: `/ui/icons/icon_${name}.png`,
          displayPx: candidate,
        };
      }
    }
  }

  return {
    src: `/ui/icons/icon_${name}.png`,
    displayPx: ICON_NATIVE_PX,
  };
}

/**
 * Same integer-scale choice as `resolveIconAsset`, but only among files that
 * are actually in `public/ui/icons`. Returns null when neither
 * `icon_<name>.png` nor `icon_<name>_x4.png` is present so callers can keep
 * a placeholder until the art is dropped in.
 */
export function resolveShippedIcon(
  name: string,
  requestedSize: number,
  files: readonly string[],
): { src: string; displayPx: number } | null {
  const shipped = new Set(files);
  const nativeName = `icon_${name}.png`;
  const x4Name = `icon_${name}_x4.png`;
  const hasNative = shipped.has(nativeName);
  const hasX4 = shipped.has(x4Name);
  if (!hasNative && !hasX4) return null;

  const want = Math.max(1, Math.round(requestedSize));

  for (let delta = 0; delta <= 8; delta++) {
    for (const candidate of delta === 0 ? [want] : [want - delta, want + delta]) {
      if (candidate < 1) continue;
      if (hasX4 && ICON_X4_PX % candidate === 0) {
        return { src: `/ui/icons/${x4Name}`, displayPx: candidate };
      }
      if (hasNative && ICON_NATIVE_PX % candidate === 0) {
        return { src: `/ui/icons/${nativeName}`, displayPx: candidate };
      }
      if (hasNative && candidate % ICON_NATIVE_PX === 0) {
        return { src: `/ui/icons/${nativeName}`, displayPx: candidate };
      }
    }
  }

  if (hasNative) {
    return { src: `/ui/icons/${nativeName}`, displayPx: ICON_NATIVE_PX };
  }
  return { src: `/ui/icons/${x4Name}`, displayPx: ICON_X4_PX };
}

export function resolveAvatarAsset(
  role: FramedAvatarRole,
  requestedSize: number,
): { src: string; displayPx: number } {
  const want = Math.max(1, Math.round(requestedSize));

  for (let delta = 0; delta <= 8; delta++) {
    for (const candidate of delta === 0 ? [want] : [want - delta, want + delta]) {
      if (candidate < 1) continue;
      if (AVATAR_X4_PX % candidate === 0) {
        return {
          src: `/ui/avatars/avatar_${role}_x4.png`,
          displayPx: candidate,
        };
      }
      if (AVATAR_NATIVE_PX % candidate === 0) {
        return {
          src: `/ui/avatars/avatar_${role}.png`,
          displayPx: candidate,
        };
      }
      if (candidate % AVATAR_NATIVE_PX === 0) {
        return {
          src: `/ui/avatars/avatar_${role}.png`,
          displayPx: candidate,
        };
      }
    }
  }

  return {
    src: `/ui/avatars/avatar_${role}.png`,
    displayPx: AVATAR_NATIVE_PX,
  };
}
