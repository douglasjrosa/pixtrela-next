import { test, expect } from "@playwright/test";

test.describe("Exchange module", () => {
  test("colaborator private home requires authentication", async ({ page }) => {
    await page.goto("/some-colaborator-id");
    await expect(page).toHaveURL(/\/login/);
  });
});
