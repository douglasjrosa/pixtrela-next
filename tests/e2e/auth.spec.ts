import { test, expect } from "@playwright/test";

test.describe("authentication", () => {
  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Entrar no Pixtrela")).toBeVisible();
  });

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/board");
    await expect(page).toHaveURL(/\/login/);
  });

  test("tasks route requires login", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login/);
  });
});
