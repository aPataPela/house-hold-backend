import { expect, test } from "@playwright/test";

test("happy path: create own absence", async ({ page }) => {
  await page.goto("/absences-demo?scenario=happy");

  await expect(page.getByText(/ausencia guardada/i)).toBeVisible();
  await expect(page.getByText(/vacaciones/i)).toBeVisible();
});

test("no permission: member cannot manage another person's absence", async ({ page }) => {
  await page.goto("/absences-demo?scenario=no-permission");

  await expect(page.getByRole("combobox", { name: /integrante/i })).toHaveValue("member-1");
  await expect(page.getByRole("option", { name: /bea/i })).toBeDisabled();
  await expect(page.getByRole("option", { name: /carla/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /cancelar/i })).toHaveCount(0);
});

test("date conflict: overlapping absence is blocked", async ({ page }) => {
  await page.goto("/absences-demo?scenario=conflict");

  await expect(page.getByText(/conflicto de fechas/i)).toBeVisible();
  await expect(page.getByText(/viaje corto/i)).toBeVisible();
});
