import type { StageId } from "./config";

export type { StageId };

export type Vec = [number, number];

export type SocketName =
  | "display"
  | "side"
  | "keyboard"
  | "mouse"
  | "cup"
  | "plant"
  | "gadget"
  | "under"
  | "top"
  | "top2";

export type Category =
  | "bed"
  | "desk"
  | "chair"
  | "display"
  | "side_device"
  | "keyboard"
  | "mouse"
  | "cup"
  | "desk_plant"
  | "gadget"
  | "under_desk"
  | "cabinet"
  | "appliance"
  | "shelf"
  | "wardrobe"
  | "floor_decor"
  | "lounge"
  | "rug"
  | "wall_art"
  | "wall_hanging";

export type ItemKind = "floor" | "surface" | "wall" | "decal";

export type Localized = { en: string; vi: string };

export type Item = {
  id: string;
  stage: StageId;
  category: Category;
  kind: ItemKind;
  sprite: string;
  shadow?: string;
  name: Localized;
  pivot?: Vec;
  shadowOffset?: Vec;
  zBias?: number;
  sockets?: Partial<Record<SocketName, Vec>>;
  seat?: Vec;
  seatPoint?: Vec;
  overlayFromY?: number;
  notes?: string[];
};

export type SlotKind = "floor" | "surface" | "seat" | "wall" | "decal";

export type Slot = {
  id: string;
  kind: SlotKind;
  accepts: Category[];
  default: string | null;
  anchor?: Vec;
  parent?: string;
  socket?: SocketName;
  required?: boolean;
  label?: Localized;
  group?: "desk" | "room" | "wall";
};

export type Room = {
  id: StageId;
  title: Localized;
  background: string;
  size: Vec;
  bounds: {
    backWall: [number, number, number, number];
    floorTopY: number;
  };
  focusX: number;
  letterbox?: string;
  slots: Slot[];
};

export type Loadout = Record<string, string | null>;

export type AtlasFrame = {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  pivot: { x: number; y: number };
};

export type AtlasData = {
  meta: { image: string; size: { w: number; h: number }; scale: string };
  frames: Record<string, AtlasFrame>;
};

export type DrawEntry = {
  key: string;
  slotId?: string;
  sprite: string;
  x: number;
  y: number;
  srcX?: number;
  srcY?: number;
  srcW?: number;
  srcH?: number;
  layer: number;
  sortBaseline: number;
  sortSub: number | [number, number] | [number, number, number];
  anchor?: Vec;
  hitTest: boolean;
};

export type ResolvedPlacement = {
  slotId: string;
  itemId: string;
  kind: SlotKind;
  anchor: Vec;
  baseline: number;
  parentSlotId?: string;
};

export type ViewMode = "full" | "crop";

export type ViewState = {
  mode: ViewMode;
  scale: number;
  viewW: number;
  viewH: number;
  cameraX: number;
  cssW: number;
  cssH: number;
  dpr: number;
};

export type ResolveSceneOptions = {
  showCharacter: boolean;
  slotIndex: Record<string, number>;
};
