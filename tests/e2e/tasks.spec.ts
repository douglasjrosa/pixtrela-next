import { test, expect } from "@playwright/test";

import { e2eUsers, loginAs } from "./fixtures/auth";
import { createTaskE2ePayload, stepLabelPattern } from "./fixtures/task-data";
import {
  deactivateActiveTasksByName,
  loginStrapi,
} from "./fixtures/strapi";

test.describe("Tasks module", () => {
  test("tasks page requires authentication", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login/);
  });

  test("manager can create a new task", async ({ page }) => {
    test.setTimeout(120_000);

    const { login, password } = e2eUsers.manager;
    test.skip(
      !login || !password,
      "E2E_MANAGER_LOGIN and E2E_MANAGER_PASSWORD required",
    );

    const jwt = await loginStrapi(login, password);
    await deactivateActiveTasksByName(jwt, createTaskE2ePayload.name);

    await loginAs(page, login, password);
    await page.goto("/tasks", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Gerenciar tarefas" }),
    ).toBeVisible({ timeout: 60_000 });

    const nameInput = page.getByLabel("Nome");
    const qtyInput = page.getByLabel("Quantidade");
    const dateInput = page.getByLabel("Data de entrega");
    const stepSelect = page.locator("#stepDocumentId");
    const statusSelect = page.locator("#status");
    const codeInput = page.getByLabel("Código do modelo");

    const stepLabels = await stepSelect.locator("option").allTextContents();
    const stepLabel = stepLabels.find(
      (label) => stepLabelPattern.test(label) && label.trim() !== "",
    );
    expect(
      stepLabel,
      `No step matching ${stepLabelPattern} in: ${stepLabels.join(", ")}`,
    ).toBeTruthy();

    // The dev server hydrates/re-streams late, resetting fields set too early.
    // Re-fill the whole form until the text values stick, proving React settled.
    await expect(async () => {
      await nameInput.fill(createTaskE2ePayload.name);
      await qtyInput.fill(createTaskE2ePayload.qty);
      await dateInput.fill(createTaskE2ePayload.deliveryDate);
      await stepSelect.selectOption({ label: stepLabel! });
      await statusSelect.selectOption({ label: createTaskE2ePayload.statusLabel });
      await codeInput.fill(createTaskE2ePayload.templateTaskCode);

      await expect(nameInput).toHaveValue(createTaskE2ePayload.name, {
        timeout: 1_000,
      });
      await expect(qtyInput).toHaveValue(createTaskE2ePayload.qty, {
        timeout: 1_000,
      });
    }).toPass({ timeout: 40_000 });

    const activeMatchingRows = page
      .getByRole("row")
      .filter({
        has: page.getByRole("link", {
          name: createTaskE2ePayload.name,
          exact: true,
        }),
      })
      .filter({ hasNot: page.getByText("Inativa") });

    await expect(activeMatchingRows).toHaveCount(0);

    const saveButton = page.getByRole("button", { name: "Salvar" });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(activeMatchingRows).toHaveCount(1, { timeout: 60_000 });

    const taskRow = activeMatchingRows.first();
    await expect(taskRow).toContainText(createTaskE2ePayload.qty);
    await expect(taskRow).toContainText(createTaskE2ePayload.deliveryDatePtBr);
    await expect(taskRow).toContainText(createTaskE2ePayload.statusLabel);
  });
});
