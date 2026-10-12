import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ALPHA_SOFT, CHAR_DOWNSCALE, CHAR_KEY, POSES } from "./character.config";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SHEET = path.join(ROOT, "public/assets/character/character_sheet.jpg");
const OUT_DIR = path.join(ROOT, "public/assets/character/derived");

function distKey(r: number, g: number, b: number) {
  const dr = r - CHAR_KEY.r;
  const dg = g - CHAR_KEY.g;
  const db = b - CHAR_KEY.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function cutPose(name: string, rect: [number, number, number, number]) {
  const [x0, y0, x1, y1] = rect;
  const { data, info } = await sharp(SHEET)
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4]!;
    const g = data[i * 4 + 1]!;
    const b = data[i * 4 + 2]!;
    const d = distKey(r, g, b);
    let alpha = (d - ALPHA_SOFT.low) / (ALPHA_SOFT.high - ALPHA_SOFT.low);
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;
    let rr = r;
    let bb = b;
    const spill = Math.min(r, b) - g;
    if (alpha < 1 && spill > 0) {
      rr = Math.min(r, g + 30);
      bb = Math.min(b, g + 30);
    }
    const a = alpha >= 0.5 ? 255 : 0;
    const o = i * 4;
    out[o] = rr;
    out[o + 1] = g;
    out[o + 2] = bb;
    out[o + 3] = a;
  }

  const nw = Math.round(w / CHAR_DOWNSCALE);
  const nh = Math.round(h / CHAR_DOWNSCALE);
  const trimmed = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .resize(nw, nh, { kernel: "box" })
    .png()
    .toBuffer();

  const outPath = path.join(OUT_DIR, `char_${name}.png`);
  await sharp(trimmed).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  return { name, w: meta.width!, h: meta.height! };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, rect] of Object.entries(POSES)) {
    const r = await cutPose(name, rect);
    console.log("cut", r.name, r.w, r.h);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
