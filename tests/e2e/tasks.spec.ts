import { test, expect } from "@playwright/test";

test.describe("Tasks module", () => {
  test("tasks page requires authentication", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login/);
  });
});
