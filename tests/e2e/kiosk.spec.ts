import { test, expect } from "@playwright/test";

import { e2eUsers, loginAs } from "./fixtures/auth";

test.describe("Kiosk", () => {
  test("kiosk home requires login when unauthenticated", async ({ page }) => {
    await page.goto("/kiosk");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.url()).toContain("callbackUrl=%2Fkiosk");
  });

  test("kiosk panel requires login when unauthenticated", async ({ page }) => {
    await page.goto("/kiosk/test-colaborator-id");
    await expect(page).toHaveURL(/\/login/);
  });

  test("kiosk home is accessible after kiosk login", async ({ page }) => {
    const login = process.env.E2E_KIOSK_LOGIN ?? "";
    const password = process.env.E2E_KIOSK_PASSWORD ?? "";
    test.skip(!login || !password, "E2E_KIOSK_LOGIN and E2E_KIOSK_PASSWORD required");

    await loginAs(page, login, password);
    await page.goto("/kiosk");
    await expect(page).toHaveURL(/\/kiosk$/);
    await expect(
      page.getByText("Aproxime o seu cartão ou digite seu código e senha."),
    ).toBeVisible();
  });

  test("kiosk shows code and password fields when authenticated", async ({
    page,
  }) => {
    const login = process.env.E2E_KIOSK_LOGIN ?? "";
    const password = process.env.E2E_KIOSK_PASSWORD ?? "";
    test.skip(!login || !password, "E2E_KIOSK_LOGIN and E2E_KIOSK_PASSWORD required");

    await loginAs(page, login, password);
    await page.goto("/kiosk");
    await expect(page.getByLabel(/Código/i)).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();
  });

  test("colaborator cannot access kiosk routes", async ({ page }) => {
    const { login, password } = e2eUsers.colaborator;
    test.skip(!login || !password, "E2E colaborator credentials required");

    await loginAs(page, login, password);
    await page.goto("/kiosk");
    await expect(page).not.toHaveURL(/\/kiosk$/);
  });
});
