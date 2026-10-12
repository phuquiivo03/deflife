import type { Item, Room, StageId } from "../types";
import { assertRoomSize, catalogSchema, roomSchema } from "./schema";
import catalogJson from "./items.json";
import studentRoom from "./rooms/student.json";
import juniorRoom from "./rooms/junior.json";
import seniorRoom from "./rooms/senior.json";

const catalogParsed = catalogSchema.parse(catalogJson);
const roomsParsed = [
  roomSchema.parse(studentRoom),
  roomSchema.parse(juniorRoom),
  roomSchema.parse(seniorRoom),
] as Room[];

for (const room of roomsParsed) {
  assertRoomSize(room);
}

const itemsById = new Map<string, Item>(
  catalogParsed.items.map((i) => [i.id, i as Item]),
);

const roomsById = new Map<StageId, Room>(
  roomsParsed.map((r) => [r.id, r as Room]),
);

export function getCatalog() {
  return {
    version: catalogParsed.version,
    units: catalogParsed.units,
    socketOrder: catalogParsed.socketOrder,
    items: catalogParsed.items as Item[],
    itemsById,
  };
}

export function getRoom(id: StageId): Room {
  const room = roomsById.get(id);
  if (!room) throw new Error(`Unknown room ${id}`);
  return room;
}

export function getItemsForCategory(category: string): Item[] {
  return catalogParsed.items.filter((i) => i.category === category) as Item[];
}
