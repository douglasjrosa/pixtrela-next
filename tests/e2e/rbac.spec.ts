import { test, expect } from "@playwright/test";

test.describe("RBAC route guards", () => {
  test("templates redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/templates");
    await expect(page).toHaveURL(/\/login/);
  });

  test("teams redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/teams");
    await expect(page).toHaveURL(/\/login/);
  });

  test("settings redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("exchange redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/exchange");
    await expect(page).toHaveURL(/\/login/);
  });
});
