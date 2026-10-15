import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { MaxRectsPacker } from "maxrects-packer";

const ROOT = path.resolve(import.meta.dirname, "../..");
const ASSETS = path.join(ROOT, "public/assets");
const OUT_DIR = path.join(ROOT, "public/atlas");
const PADDING = 1;

type PackInput = {
  key: string;
  file: string;
  trim: boolean;
};

function listSprites(): PackInput[] {
  const out: PackInput[] = [];
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!name.endsWith(".png") || /_x\d+\.png$/.test(name)) continue;
      const rel = path.relative(ASSETS, p).replace(/\\/g, "/").replace(/\.png$/, "");
      const isShadow = name.endsWith("_shadow.png");
      out.push({ key: rel, file: p, trim: !isShadow });
    }
  };
  walk(path.join(ASSETS, "furniture"));
  const derived = path.join(ASSETS, "character/derived");
  if (fs.existsSync(derived)) {
    for (const name of fs.readdirSync(derived)) {
      if (!name.endsWith(".png")) continue;
      const p = path.join(derived, name);
      const rel = path.relative(ASSETS, p).replace(/\\/g, "/").replace(/\.png$/, "");
      out.push({ key: rel, file: p, trim: true });
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

async function loadTrimmed(input: PackInput) {
  const img = sharp(input.file).ensureAlpha();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error(`Bad image ${input.file}`);
  if (!input.trim) {
    const buf = await img.png().toBuffer();
    return {
      key: input.key,
      buffer: buf,
      w: meta.width,
      h: meta.height,
      sourceW: meta.width,
      sourceH: meta.height,
      trimX: 0,
      trimY: 0,
      pivotX: Math.floor(meta.width / 2),
      pivotY: meta.height,
    };
  }
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3]!;
      if (a > 127) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`Empty sprite ${input.key}`);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const buf = await sharp(input.file)
    .extract({ left: minX, top: minY, width: tw, height: th })
    .png()
    .toBuffer();
  return {
    key: input.key,
    buffer: buf,
    w: tw,
    h: th,
    sourceW: info.width,
    sourceH: info.height,
    trimX: minX,
    trimY: minY,
    pivotX: Math.floor(tw / 2),
    pivotY: th,
  };
}

async function main() {
  const sprites = listSprites();
  const loaded = await Promise.all(sprites.map(loadTrimmed));
  const packer = new MaxRectsPacker(1024, 1024, PADDING, {
    smart: true,
    pot: false,
    square: false,
  });
  packer.addArray(
    loaded.map((s) => ({
      width: s.w + PADDING * 2,
      height: s.h + PADDING * 2,
      data: s,
    })) as Parameters<typeof packer.addArray>[0],
  );
  const bin = packer.bins[0];
  if (!bin) throw new Error("pack failed");
  const atlasW = bin.width;
  const atlasH = bin.height;
  const composites: { input: Buffer; left: number; top: number }[] = [];
  const frames: Record<string, unknown> = {};
  for (const rect of bin.rects) {
    const s = rect.data as (typeof loaded)[0];
    const x = rect.x + PADDING;
    const y = rect.y + PADDING;
    composites.push({ input: s.buffer, left: x, top: y });
    frames[s.key] = {
      frame: { x, y, w: s.w, h: s.h },
      rotated: false,
      trimmed: s.trimX !== 0 || s.trimY !== 0 || s.w !== s.sourceW || s.h !== s.sourceH,
      spriteSourceSize: { x: s.trimX, y: s.trimY, w: s.w, h: s.h },
      sourceSize: { w: s.sourceW, h: s.sourceH },
      pivot: { x: s.pivotX, y: s.pivotY },
    };
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPng = path.join(OUT_DIR, "devlife.png");
  await sharp({
    create: {
      width: atlasW,
      height: atlasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPng);
  const json = {
    meta: {
      image: "devlife.png",
      size: { w: atlasW, h: atlasH },
      scale: "1",
    },
    frames,
  };
  fs.writeFileSync(path.join(OUT_DIR, "devlife.json"), JSON.stringify(json, null, 2));
  console.log("atlas", atlasW, "x", atlasH, "frames", Object.keys(frames).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
