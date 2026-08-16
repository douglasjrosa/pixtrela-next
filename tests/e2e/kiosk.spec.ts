import { test, expect } from "@playwright/test";

import { e2eUsers, loginAs } from "./fixtures/auth";
import {
  seedKioskChainFixture,
  seedKioskWorkflowFixture,
} from "./fixtures/kiosk-workflow";

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

  test("kiosk chain group start, stop form, and confirm", async ({ page }) => {
    test.skip(!isDrizzleE2e, "Drizzle-only kiosk workflow E2E");

    const kioskLogin = process.env.E2E_KIOSK_LOGIN ?? "";
    const kioskPassword = process.env.E2E_KIOSK_PASSWORD ?? "";
    test.skip(
      !kioskLogin || !kioskPassword,
      "E2E_KIOSK_LOGIN and E2E_KIOSK_PASSWORD required",
    );

    test.setTimeout(180_000);

    const fixture = await seedKioskChainFixture("chain");

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
    await expect(page.getByTestId("kiosk-chain-group")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(fixture.memberNames[0]!)).toBeVisible();
    await expect(page.getByText(fixture.memberNames[1]!)).toBeVisible();
    await expect(page.getByText(fixture.memberNames[2]!)).toBeVisible();

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    const stop = page.getByRole("button", { name: /^Parar$/i });
    await expect(stop).toBeVisible({ timeout: 30_000 });

    await stop.click();
    await expect(page.getByText("A subtarefa foi concluída?")).toHaveCount(3);
    await expect(stop).toBeDisabled();

    const yesButtons = page.getByRole("button", { name: /Sim, concluí/i });
    await expect(yesButtons).toHaveCount(3);
    await yesButtons.nth(0).click();
    await yesButtons.nth(1).click();
    await yesButtons.nth(2).click();
    await expect(stop).toBeEnabled();
    await stop.click();

    await expect(page.getByText(fixture.memberNames[0]!)).toBeVisible({
      timeout: 30_000,
    });
  });
});
