import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const keys = [
  ["ui_dialog_frame.png", 48],
  ["ui_diary_page.png", 48],
  ["ui_banner.png", 48],
  ["ui_store_frame.png", 48],
  ["ui_store_card.png", 48],
  ["ui_badge_unread.png", 16],
  ["portrait_mom.png", 48],
  ["portrait_crush.png", 48],
  ["portrait_landlord.png", 48],
  ["portrait_client.png", 48],
  ["portrait_boss.png", 48],
  ["portrait_roommate.png", 48],
  ["portrait_headhunter.png", 48],
  ["portrait_coworker.png", 48],
  ["icon_notif_money.png", 16],
  ["icon_notif_rent.png", 16],
  ["icon_notif_salary.png", 16],
  ["icon_notif_bill.png", 16],
  ["icon_notif_sick.png", 16],
  ["icon_notif_burnout.png", 16],
  ["icon_notif_deadline.png", 16],
  ["icon_notif_job.png", 16],
  ["icon_notif_store.png", 16],
  ["icon_notif_rain.png", 16],
  ["icon_notif_power_outage.png", 16],
  ["icon_notif_event.png", 16],
  ["icon_notif_sale.png", 16],
  ["icon_severity_info.png", 16],
  ["icon_severity_warn.png", 16],
  ["icon_severity_urgent.png", 16],
  ["emote_cough.png", 16],
  ["emote_cloud.png", 16],
  ["emote_happy.png", 16],
  ["emote_sweat.png", 16],
  ["ui_speech_bubble.png", 32],
  ["item_plant.png", 32],
  ["item_fan.png", 32],
  ["item_aircon.png", 32],
  ["item_ergo_chair.png", 32],
  ["item_monitor2.png", 32],
  ["item_mattress.png", 32],
  ["icon_store_plant.png", 32],
  ["icon_store_fan.png", 32],
  ["icon_store_aircon.png", 32],
  ["icon_store_ergo_chair.png", 32],
  ["icon_store_monitor2.png", 32],
  ["icon_store_mattress.png", 32],
  ["icon_trait_night_owl.png", 16],
  ["icon_trait_diligent.png", 16],
  ["icon_trait_extrovert.png", 16],
  ["icon_trait_frugal.png", 16],
  ["icon_trait_careful.png", 16],
  ["icon_trait_optimist.png", 16],
];

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const p = row + 1 + x * 4;
      const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1;
      raw[p] = edge ? 74 : rgba[0];
      raw[p + 1] = edge ? 144 : rgba[1];
      raw[p + 2] = edge ? 226 : rgba[2];
      raw[p + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const root = join(process.cwd(), "public/ui/m5");
mkdirSync(root, { recursive: true });
for (const [name, size] of keys) {
  const file = join(root, name);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png(size, [196, 182, 232]));
}
console.log(`wrote ${keys.length} placeholders`);
