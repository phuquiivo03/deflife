import {
  CHAR_POSE_SIT_BACK,
  FLOOR_SIT_OFFSET_Y,
  SIT_HIP_FROM_BOTTOM,
} from "../config";
import type {
  DrawEntry,
  Item,
  Loadout,
  PoseDef,
  ResolvedPlacement,
  ResolveSceneOptions,
  Room,
  Slot,
  SocketName,
} from "../types";
import { sortDrawEntries } from "./sort";

export type FrameLookup = (
  sprite: string,
) => { w: number; h: number; pivotX: number; pivotY: number };

type Catalog = {
  itemsById: Map<string, Item>;
  socketOrder: string[];
  poses: Record<string, PoseDef>;
};

const LAYER_WALL = 1;
const LAYER_DECAL = 2;
const LAYER_SHADOW = 3;
const LAYER_OBJECT = 4;

function socketRank(socketOrder: string[], socket?: string): number {
  if (!socket) return 0;
  const idx = socketOrder.indexOf(socket);
  return idx >= 0 ? idx : 99;
}

function pickItem(
  slot: Slot,
  loadout: Loadout,
  itemsById: Map<string, Item>,
): string | null {
  const raw = loadout[slot.id] ?? slot.default;
  if (raw === null) return null;
  const item = itemsById.get(raw);
  if (!item) return slot.default;
  if (!slot.accepts.includes(item.category)) return slot.default;
  return raw;
}

function drawPos(
  anchor: [number, number],
  frame: { w: number; h: number; pivotX: number; pivotY: number },
): { x: number; y: number } {
  return {
    x: Math.round(anchor[0] - frame.pivotX),
    y: Math.round(anchor[1] - frame.pivotY),
  };
}

export function resolveScene(
  room: Room,
  catalog: Catalog,
  loadout: Loadout,
  frames: FrameLookup,
  opts: ResolveSceneOptions,
): { entries: DrawEntry[]; placements: ResolvedPlacement[] } {
  const slots = room.slots;
  const slotById = new Map(slots.map((s) => [s.id, s]));
  const chosen: Record<string, string | null> = {};
  for (const s of slots) {
    chosen[s.id] = pickItem(s, loadout, catalog.itemsById);
  }

  const placed: Record<
    string,
    | {
        slotId: string;
        itemId: string;
        kind: Slot["kind"];
        anchor: [number, number];
        baseline: number;
        parentSlotId?: string;
      }
    | null
    | undefined
  > = {};

  const socketOrder = catalog.socketOrder;

  function resolveSlot(sid: string): (typeof placed)[string] {
    if (sid in placed) return placed[sid];
    const slot = slotById.get(sid);
    if (!slot) {
      placed[sid] = null;
      return null;
    }
    const itemId = chosen[sid];
    if (!itemId) {
      placed[sid] = null;
      return null;
    }

    if (slot.kind === "surface" || slot.kind === "seat") {
      const parent = slot.parent ? resolveSlot(slot.parent) : null;
      if (!parent) {
        placed[sid] = null;
        return null;
      }
      const parentItem = catalog.itemsById.get(parent.itemId);
      if (!parentItem) {
        placed[sid] = null;
        return null;
      }
      let off: [number, number] | undefined;
      if (slot.kind === "seat") {
        off = parentItem.seat;
      } else {
        off = parentItem.sockets?.[slot.socket as SocketName];
      }
      if (!off) {
        placed[sid] = null;
        return null;
      }
      const anchor: [number, number] = [
        parent.anchor[0] + off[0],
        parent.anchor[1] + off[1],
      ];
      const baseline = slot.kind === "seat" ? anchor[1] : parent.baseline;
      placed[sid] = {
        slotId: sid,
        itemId,
        kind: slot.kind,
        anchor,
        baseline,
        parentSlotId: slot.parent,
      };
      return placed[sid];
    }

    const anchor = slot.anchor!;
    placed[sid] = {
      slotId: sid,
      itemId,
      kind: slot.kind,
      anchor,
      baseline: anchor[1],
    };
    return placed[sid];
  }

  for (const s of slots) resolveSlot(s.id);

  const entries: DrawEntry[] = [];
  const placements: ResolvedPlacement[] = [];

  let deskPlacement: (typeof placed)[string] | null = null;
  let seatPlacement: (typeof placed)[string] | null = null;
  let seatItem: Item | undefined;

  for (const slot of slots) {
    const p = placed[slot.id];
    if (!p) continue;
    const item = catalog.itemsById.get(p.itemId);
    if (!item) continue;

    placements.push({
      slotId: p.slotId,
      itemId: p.itemId,
      kind: p.kind,
      anchor: p.anchor,
      baseline: p.baseline,
      parentSlotId: p.parentSlotId,
    });

    if (slot.id === "desk") deskPlacement = p;
    if (slot.kind === "seat") {
      seatPlacement = p;
      seatItem = item;
    }

    const hideArt = opts.suppressItemIds?.has(p.itemId) === true;
    const frame = frames(item.sprite);
    const { x, y } = drawPos(p.anchor, frame);

    const layer =
      p.kind === "wall"
        ? LAYER_WALL
        : p.kind === "decal"
          ? LAYER_DECAL
          : LAYER_OBJECT;

    let sortSub: number | [number, number, number] = [0, 0, 0];

    const slotIndex = opts.slotIndex[slot.id] ?? 0;
    if (p.kind === "surface" && slot.socket) {
      sortSub = [1 + socketRank(socketOrder, slot.socket), p.anchor[1], slotIndex];
    } else {
      sortSub = [0, slotIndex, 0];
    }

    if (!hideArt) {
      entries.push({
        key: `${p.slotId}:sprite`,
        slotId: p.slotId,
        sprite: item.sprite,
        x,
        y,
        layer,
        sortBaseline: p.baseline + (item.zBias ?? 0),
        sortSub,
        anchor: p.anchor,
        hitTest: true,
      });
    }

    if (!hideArt && item.shadow && (p.kind === "floor" || p.kind === "seat")) {
      const sh = frames(item.shadow);
      const so = item.shadowOffset ?? [0, 0];
      entries.push({
        key: `${p.slotId}:shadow`,
        slotId: p.slotId,
        sprite: item.shadow,
        x: Math.round(p.anchor[0] - Math.floor(sh.w / 2) + so[0]),
        y: Math.round(p.anchor[1] - Math.floor(sh.h / 2) - 1 + so[1]),
        layer: LAYER_SHADOW,
        sortBaseline: 0,
        sortSub: 0,
        hitTest: false,
      });
    }
  }

  if (opts.showCharacter && deskPlacement) {
    const deskItem = catalog.itemsById.get(deskPlacement.itemId);
    if (deskItem?.seat) {
      const onChair = Boolean(seatPlacement && seatItem?.seatPoint);
      const floorPose = !onChair ? deskItem.floorSit : undefined;
      const pose = floorPose ? catalog.poses[floorPose.pose] : undefined;
      const sprite = pose?.sprite ?? CHAR_POSE_SIT_BACK;
      const hipFromBottom = pose?.hipFromBottom ?? SIT_HIP_FROM_BOTTOM;
      const charFrame = frames(sprite);
      let hipAnchor: [number, number];
      if (onChair && seatPlacement && seatItem?.seatPoint) {
        hipAnchor = [
          seatPlacement.anchor[0] + seatItem.seatPoint[0],
          seatPlacement.anchor[1] + seatItem.seatPoint[1],
        ];
      } else if (floorPose) {
        hipAnchor = [
          deskPlacement.anchor[0] + floorPose.offset[0],
          deskPlacement.anchor[1] + floorPose.offset[1],
        ];
      } else {
        hipAnchor = [
          deskPlacement.anchor[0] + deskItem.seat[0],
          deskPlacement.anchor[1] + deskItem.seat[1] + FLOOR_SIT_OFFSET_Y,
        ];
      }
      const cx = hipAnchor[0];
      const cy = hipAnchor[1];
      const charX = cx - Math.floor(charFrame.w / 2);
      const charY = cy - charFrame.h + hipFromBottom;
      let sortBaseline = seatPlacement?.baseline ?? hipAnchor[1];
      let sortSub: DrawEntry["sortSub"] = 1;
      if (floorPose) {
        sortBaseline = deskPlacement.baseline;
        let maxPrimary = 0;
        for (const socket of floorPose.drawAfter) {
          const primary = 1 + socketRank(socketOrder, socket);
          if (primary > maxPrimary) maxPrimary = primary;
        }
        sortSub = [maxPrimary, 1_000_000, 0];
      }

      entries.push({
        key: "character",
        sprite,
        x: charX,
        y: charY,
        layer: LAYER_OBJECT,
        sortBaseline,
        sortSub,
        anchor: hipAnchor,
        hitTest: false,
      });

      if (!opts.suppressItemIds?.has(seatItem?.id ?? "") && seatPlacement && seatItem && seatItem.overlayFromY !== undefined) {
        const chairFrame = frames(seatItem.sprite);
        const cutY = chairFrame.h + seatItem.overlayFromY;
        if (cutY > 0 && cutY < chairFrame.h) {
          const chairPos = drawPos(seatPlacement.anchor, chairFrame);
          entries.push({
            key: `${seatPlacement.slotId}:overlay`,
            slotId: seatPlacement.slotId,
            sprite: seatItem.sprite,
            x: chairPos.x,
            y: chairPos.y + cutY,
            srcX: 0,
            srcY: cutY,
            srcW: chairFrame.w,
            srcH: chairFrame.h - cutY,
            layer: LAYER_OBJECT,
            sortBaseline,
            sortSub: 2,
            hitTest: false,
          });
        }
      }
    }
  }

  return { entries: sortDrawEntries(entries), placements };
}
