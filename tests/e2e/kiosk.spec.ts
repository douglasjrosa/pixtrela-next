import { test, expect } from "@playwright/test";

import { e2eUsers, loginAs } from "./fixtures/auth";
import { seedKioskWorkflowFixture } from "./fixtures/kiosk-workflow";

const isDrizzleE2e =
  (process.env.DATA_BACKEND ?? "drizzle").trim().toLowerCase() !== "strapi";

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

  test("kiosk start and exit flow with drizzle backend", async ({ page }) => {
    test.skip(!isDrizzleE2e, "Drizzle-only kiosk workflow E2E");

    const kioskLogin = process.env.E2E_KIOSK_LOGIN ?? "";
    const kioskPassword = process.env.E2E_KIOSK_PASSWORD ?? "";
    test.skip(
      !kioskLogin || !kioskPassword,
      "E2E_KIOSK_LOGIN and E2E_KIOSK_PASSWORD required",
    );

    test.setTimeout(180_000);

    const fixture = await seedKioskWorkflowFixture("flow");

    await loginAs(page, kioskLogin, kioskPassword);
    await page.goto("/kiosk");
    await expect(page).toHaveURL(/\/kiosk$/);

    await page.getByRole("button", { name: /código|code/i }).click();
    await page.getByLabel(/Código/i).fill(String(fixture.colaboratorCode));
    await page.getByLabel(/Senha/i).fill(fixture.colaboratorPassword);
    await page.getByRole("button", { name: /entrar|confirmar/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/kiosk/${fixture.colaboratorId}`),
      { timeout: 60_000 },
    );
    await expect(page.getByText(fixture.subTaskName)).toBeVisible({
      timeout: 60_000,
    });

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await expect(page.getByRole("button", { name: /Sair da subtarefa/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: /Sair da subtarefa/i }).click();
    await page.getByRole("button", { name: /Sim, concluí/i }).click();

    await expect(page.getByText(fixture.subTaskName)).toBeVisible({
      timeout: 30_000,
    });
  });
});
