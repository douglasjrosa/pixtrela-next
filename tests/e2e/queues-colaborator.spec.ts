import { test, expect, type Page } from "@playwright/test";

import { e2eUsers, loginAs } from "./fixtures/auth";
import {
  seedQueueCategoryWithFlags,
  seedQueueScenario,
} from "../queue/seed-queue-scenario";

const isDrizzleE2e =
  (process.env.DATA_BACKEND ?? "drizzle").trim().toLowerCase() !== "strapi";

const hasManager =
  Boolean(e2eUsers.manager.login) && Boolean(e2eUsers.manager.password);

test.describe("Queues /queues/[colaboratorId]", () => {
  test.skip(!isDrizzleE2e, "Drizzle-only queue suite E2E");
  test.skip(!hasManager, "E2E_MANAGER_LOGIN and E2E_MANAGER_PASSWORD required");

  test.beforeEach(async ({ page }) => {
    test.setTimeout(180_000);
    await loginAs(page, e2eUsers.manager.login, e2eUsers.manager.password);
  });

  test("qty half then remaining never shows two Iniciar", async ({ page }) => {
    const seed = await seedQueueScenario({
      label: "e2e-qty",
      subTasks: [
        {
          name: "E2E Qty",
          sharingType: "qty",
          qty: 10,
          expectedTime: 20,
          index: 0,
        },
        {
          name: "E2E After Qty",
          sharingType: "duration",
          expectedTime: 20,
          index: 1,
        },
      ],
    });
    const workerId = seed.workers[0]!.id;
    await openQueue(page, workerId);
    await expectStartCount(page, 1);

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await expect(
      page.getByRole("button", { name: /Sair da subtarefa/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expectStartCount(page, 1);

    await page.getByRole("button", { name: /Sair da subtarefa/i }).click();
    await page.getByLabel(/Quantas peças você concluiu/i).fill("5");
    await page.getByRole("button", { name: /^Confirmar saída$/i }).click();
    await expect(page.getByRole("button", { name: /^Iniciar$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expectStartCount(page, 1);

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await page.getByRole("button", { name: /Sair da subtarefa/i }).click({
      timeout: 30_000,
    });
    await page.getByLabel(/Quantas peças você concluiu/i).fill("5");
    await page.getByRole("button", { name: /^Confirmar saída$/i }).click();
    await expect(page.getByText("E2E After Qty")).toBeVisible({
      timeout: 30_000,
    });
    await expectStartCount(page, 1);
  });

  test("duration pause then finish", async ({ page }) => {
    const seed = await seedQueueScenario({
      label: "e2e-dur",
      subTasks: [
        {
          name: "E2E Duration",
          sharingType: "duration",
          expectedTime: 20,
          index: 0,
        },
      ],
    });
    await openQueue(page, seed.workers[0]!.id);
    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await page.getByRole("button", { name: /Sair da subtarefa/i }).click({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /Não, ainda não/i }).click();
    await expect(page.getByRole("button", { name: /^Iniciar$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expectStartCount(page, 1);

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await page.getByRole("button", { name: /Sair da subtarefa/i }).click({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /Sim, concluí/i }).click();
    await expect(page.getByText("E2E Duration")).toBeVisible({
      timeout: 30_000,
    });
    await expectStartCount(page, 0);
  });

  test("chain pause then finish with a single Iniciar", async ({ page }) => {
    const seed = await seedQueueScenario({
      label: "e2e-chain",
      subTasks: [
        {
          name: "E2E Chain A",
          sharingType: "duration",
          expectedTime: 20,
          index: 0,
        },
        {
          name: "E2E Chain B",
          sharingType: "duration",
          expectedTime: 20,
          index: 1,
          linkedToPrevious: true,
        },
      ],
    });
    await openQueue(page, seed.workers[0]!.id);
    await expect(page.getByTestId("kiosk-chain-group")).toBeVisible({
      timeout: 60_000,
    });
    await expectStartCount(page, 1);

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await expect(page.getByRole("button", { name: /^Parar$/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /^Parar$/i }).click({
      timeout: 30_000,
    });
    await answerChainDuration(page, false);
    await page.getByRole("button", { name: /^Continuar$/i }).click();
    await answerChainDuration(page, false);
    await confirmChainExit(page);
    await expect(page.getByRole("button", { name: /^Iniciar$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expectStartCount(page, 1);

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await page.getByRole("button", { name: /^Parar$/i }).click({
      timeout: 30_000,
    });
    await answerChainDuration(page, true);
    await page.getByRole("button", { name: /^Continuar$/i }).click();
    await answerChainDuration(page, true);
    await confirmChainExit(page);
    await expect(page.getByText("E2E Chain A")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("flags required to finish producer, optional on pause", async ({
    page,
  }) => {
    const { categoryId, flagIds, flagCodes } = await seedQueueCategoryWithFlags(
      "e2e-flags",
      1,
    );
    expect(flagIds).toHaveLength(1);
    const seed = await seedQueueScenario({
      label: "e2e-flags",
      subTasks: [
        {
          name: "E2E Producer",
          sharingType: "duration",
          expectedTime: 20,
          index: 0,
          subTaskCategoryId: categoryId,
        },
        {
          name: "E2E Consumer",
          sharingType: "duration",
          expectedTime: 20,
          index: 1,
          dependencyIndexes: [0],
        },
      ],
    });
    await openQueue(page, seed.workers[0]!.id);
    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await page.getByRole("button", { name: /Sair da subtarefa/i }).click({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("button", { name: /Sim, concluí/i }),
    ).toBeDisabled();
    await page.getByRole("button", { name: /Não, ainda não/i }).click();
    await expect(page.getByRole("button", { name: /^Iniciar$/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: /^Iniciar$/i }).click();
    await page.getByRole("button", { name: /Sair da subtarefa/i }).click({
      timeout: 30_000,
    });
    const flagName = flagCodes[0]!;
    await expect(page.getByRole("button", { name: flagName })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: flagName }).click();
    await expect(
      page.getByRole("button", { name: /Sim, concluí/i }),
    ).toBeEnabled();
    await page.getByRole("button", { name: /Sim, concluí/i }).click();
    await expect(page.getByText("E2E Consumer")).toBeVisible({
      timeout: 30_000,
    });
    await expectStartCount(page, 1);
  });
});

async function openQueue(page: Page, colaboratorId: string): Promise<void> {
  await page.goto(`/queues/${colaboratorId}`);
  await expect(page.getByRole("button", { name: /^Iniciar$/i })).toBeVisible({
    timeout: 60_000,
  });
}

async function expectStartCount(page: Page, count: number): Promise<void> {
  await expect(page.getByRole("button", { name: /^Iniciar$/i })).toHaveCount(
    count,
  );
}

async function confirmChainExit(page: Page): Promise<void> {
  const confirm = page.getByRole("button", { name: /^Confirmar saída$/i });
  await expect(confirm).toBeEnabled({ timeout: 30_000 });
  await confirm.click();
}

async function answerChainDuration(
  page: Page,
  completed: boolean,
): Promise<void> {
  const name = completed ? /^SIM$/i : /^NÃO$/i;
  await page.getByRole("button", { name }).click();
}
