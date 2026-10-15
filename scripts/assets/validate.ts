import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { catalogSchema, roomSchema } from "../../src/game/content/schema";
import catalogJson from "../../src/game/content/items.json";
import studentRoom from "../../src/game/content/rooms/student.json";
import juniorRoom from "../../src/game/content/rooms/junior.json";
import seniorRoom from "../../src/game/content/rooms/senior.json";

const ROOT = path.resolve(import.meta.dirname, "../..");
const ATLAS_JSON = path.join(ROOT, "public/atlas/devlife.json");
const ATLAS_PNG = path.join(ROOT, "public/atlas/devlife.png");

function fail(msg: string) {
  throw new Error(msg);
}

async function checkHardAlpha(spritePath: string) {
  const { data, info } = await sharp(spritePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i]!;
    if (a !== 0 && a !== 255) {
      fail(`Semi-transparent pixel in ${spritePath}`);
    }
  }
  return info;
}

async function main() {
  const catalog = catalogSchema.parse(catalogJson);
  const rooms = [
    roomSchema.parse(studentRoom),
    roomSchema.parse(juniorRoom),
    roomSchema.parse(seniorRoom),
  ];
  if (!fs.existsSync(ATLAS_JSON) || !fs.existsSync(ATLAS_PNG)) {
    fail("Atlas missing — run pnpm assets");
  }
  const atlas = JSON.parse(fs.readFileSync(ATLAS_JSON, "utf8")) as {
    frames: Record<string, unknown>;
  };
  const frameKeys = new Set(Object.keys(atlas.frames));

  for (const item of catalog.items) {
    if (!frameKeys.has(item.sprite)) fail(`Missing atlas frame ${item.sprite}`);
    if (item.shadow && !frameKeys.has(item.shadow)) {
      fail(`Missing shadow frame ${item.shadow}`);
    }
    if (item.floorSit) {
      const pose = catalog.poses[item.floorSit.pose];
      if (!pose) fail(`Unknown pose ${item.floorSit.pose} on ${item.id}`);
      if (!frameKeys.has(pose.sprite)) fail(`Missing pose sprite ${pose.sprite}`);
    }
    const spriteFile = path.join(ROOT, "public/assets", `${item.sprite}.png`);
    if (!item.shadow && item.kind !== "wall" && item.kind !== "decal") {
      await checkHardAlpha(spriteFile);
    }
  }

  for (const room of rooms) {
    const slotIds = new Set(room.slots.map((s) => s.id));
    for (const slot of room.slots) {
      if (slot.default) {
        const item = catalog.items.find((i) => i.id === slot.default);
        if (!item) fail(`Default missing ${slot.default}`);
        if (!item || !slot.accepts.includes(item.category)) {
          fail(`Default category mismatch ${slot.id}`);
        }
      }
      if (slot.parent && !slotIds.has(slot.parent)) {
        fail(`Parent missing for ${slot.id}`);
      }
      if (slot.kind === "wall" && slot.anchor) {
        const [x0, y0, x1, y1] = room.bounds.backWall;
        const [ax, ay] = slot.anchor;
        if (ax < x0 || ax > x1 || ay < y0 || ay > y1) {
          fail(`Wall anchor out of bounds ${slot.id}`);
        }
      }
    }
  }
  console.log("validate ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
