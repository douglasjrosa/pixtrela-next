import { test, expect } from "@playwright/test";

test.describe("Exchange module", () => {
  test("exchange page requires authentication", async ({ page }) => {
    await page.goto("/exchange");
    await expect(page).toHaveURL(/\/login/);
  });
});
