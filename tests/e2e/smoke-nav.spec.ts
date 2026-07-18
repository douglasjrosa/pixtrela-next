import { test, expect } from "@playwright/test";

import { smokeShellHrefsForRole } from "@/lib/auth/smoke-shell-routes";
import { e2eUsers, loginAs } from "./fixtures/auth";
import { assertShellRouteLoads } from "./fixtures/smoke";

test.describe("Authenticated shell smoke", () => {
  test.describe("manager", () => {
    test.skip(
      !e2eUsers.manager.login || !e2eUsers.manager.password,
      "E2E_MANAGER_LOGIN and E2E_MANAGER_PASSWORD required",
    );

    test("nav routes load without server or client crash", async ({ page }) => {
      test.setTimeout(180_000);

      await loginAs(page, e2eUsers.manager.login, e2eUsers.manager.password);

      for (const href of smokeShellHrefsForRole("manager")) {
        await assertShellRouteLoads(page, href);
        await expect(page).not.toHaveURL(/\/login/);
      }
    });
  });

  test.describe("colaborator", () => {
    test.skip(
      !e2eUsers.colaborator.login || !e2eUsers.colaborator.password,
      "E2E_COLABORATOR_LOGIN and E2E_COLABORATOR_PASSWORD required",
    );

    test("landing shell loads without crash", async ({ page }) => {
      test.setTimeout(120_000);

      await loginAs(
        page,
        e2eUsers.colaborator.login,
        e2eUsers.colaborator.password,
      );
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("main")).toBeVisible({ timeout: 60_000 });
      await expect(
        page.getByText(/Internal Server Error|Application error/i),
      ).toHaveCount(0);

      for (const href of smokeShellHrefsForRole("colaborator")) {
        await assertShellRouteLoads(page, href);
      }
    });
  });

  test.describe("kiosk", () => {
    test.skip(
      !e2eUsers.kiosk.login || !e2eUsers.kiosk.password,
      "E2E_KIOSK_LOGIN and E2E_KIOSK_PASSWORD required",
    );

    test("home shell loads without crash", async ({ page }) => {
      test.setTimeout(120_000);

      await loginAs(page, e2eUsers.kiosk.login, e2eUsers.kiosk.password);

      for (const href of smokeShellHrefsForRole("kiosk")) {
        await assertShellRouteLoads(page, href);
        await expect(page).toHaveURL(/\/kiosk/);
      }
    });
  });
});
