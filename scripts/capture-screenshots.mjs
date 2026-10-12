import { chromium } from "@playwright/test";
import fs from "node:fs";

const outDir = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(name, viewport, fn) {
  await page.setViewportSize(viewport);
  await page.goto("http://127.0.0.1:4317/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  if (fn) await fn(page);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
}

await shot("desktop-student", { width: 1440, height: 900 });
await page.getByRole("tab", { name: /Junior/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/desktop-junior.png` });
await page.getByRole("tab", { name: /Senior/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/desktop-senior.png` });

await shot("mobile-portrait-student", { width: 390, height: 844 });

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto("http://127.0.0.1:4317/?stage=junior", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const raw = localStorage.getItem("devlife:v1");
  if (!raw) return;
  const parsed = JSON.parse(raw);
  parsed.state.loadouts.junior = {
    ...parsed.state.loadouts.junior,
    desk: "senior.standing_desk",
    seat: "senior.ergo_chair",
    display: "senior.dual_monitor",
    keyboard: "senior.keyboard_mat",
  };
  localStorage.setItem("devlife:v1", JSON.stringify(parsed));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/desktop-junior-desk-swap.png` });

await browser.close();
console.log("saved to", outDir);
