import { expect, test } from "@playwright/test";

test("renders the public tracking shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Sun Container Auftrag verfolgen/i })).toBeVisible();
  await expect(page.getByLabel("Auftrags- oder Trackingnummer")).toBeVisible();
  await expect(page.getByRole("button", { name: /Status prüfen/i })).toBeVisible();
});
