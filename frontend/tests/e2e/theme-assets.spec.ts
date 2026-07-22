import { expect, test } from "@playwright/test";

const themes = ["patagonia", "chiloe", "cordillera", "san-pedro"] as const;

for (const themeId of themes) {
  test(`theme assets: ${themeId} resolves without changing the selector UX`, async ({ page }) => {
    const failedAssets: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/assets/themes/") && !response.ok()) {
        failedAssets.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.addInitScript((activeThemeId) => {
      localStorage.setItem(
        "shared-household:theme-preference",
        JSON.stringify({
          houseThemeId: "patagonia",
          personalThemeId: activeThemeId,
          reducedTransparency: false,
        }),
      );
    }, themeId);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/personalizacion/identidad-visual", { waitUntil: "networkidle" });

    await expect(page.locator("html")).toHaveAttribute("data-theme", themeId);
    await expect(page.getByRole("heading", { name: /Elige un tema personal/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aplicar" })).toBeVisible();
    expect(failedAssets).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("changing theme preserves route, actions, selection state and functional DOM order", async ({ page }) => {
  await page.goto("/personalizacion/identidad-visual", { waitUntil: "networkidle" });
  const routeBefore = page.url();
  const actionsBefore = await page.getByRole("button").allTextContents();
  let reloads = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) reloads += 1;
  });

  const radio = page.getByRole("radio", { name: /Chiloé/i });
  await radio.focus();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "chiloe");

  expect(page.url()).toBe(routeBefore);
  expect(reloads).toBe(0);
  expect(await page.getByRole("button").allTextContents()).toEqual(actionsBefore);
  await expect(radio).toBeChecked();
});

test("theme selector supports 200 percent text zoom and reduced transparency", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "shared-household:theme-preference",
      JSON.stringify({
        houseThemeId: "patagonia",
        personalThemeId: "cordillera",
        reducedTransparency: true,
      }),
    );
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/personalizacion/identidad-visual", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  await expect(page.locator("html")).toHaveAttribute("data-reduced-transparency", "true");
  await expect(page.getByRole("button", { name: "Aplicar" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
