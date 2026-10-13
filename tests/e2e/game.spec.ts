import { test, expect } from "@playwright/test";

test("loads student room with integer canvas scale", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByText("Đang tải phòng")).toBeHidden({ timeout: 15000 });
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-scale", /.+/);
  const scale = await canvas.getAttribute("data-scale");
  expect(Number(scale)).toBeGreaterThanOrEqual(1);
  expect(Number(scale) % 1).toBe(0);
});

test("switches stage and persists desk variant", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("tab", { name: /Junior/i }).click();
  await page.getByRole("heading", { name: "Tùy chỉnh" }).waitFor();
  await page.getByTitle("Bàn nâng hạ").click();
  await page.reload();
  await expect(page.getByTitle("Bàn nâng hạ").first()).toBeVisible();
});

test("debug canvas renders", async ({ page }) => {
  await page.goto("/debug?stage=student&scale=3&character=1");
  const canvas = page.getByTestId("debug-canvas");
  await expect(canvas).toBeVisible({ timeout: 15000 });
  await expect(canvas).toHaveAttribute("data-scale", "3");
});
