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
