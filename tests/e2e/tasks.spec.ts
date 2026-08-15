import { test, expect } from "@playwright/test";

import { e2eUsers, loginAs } from "./fixtures/auth";
import { createTaskE2ePayload } from "./fixtures/task-data";
import { deactivateActiveTasksByName } from "./fixtures/drizzle";

test.describe("Tasks module", () => {
  test("tasks page requires authentication", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login/);
  });

  test("manager can create a new task", async ({ page }) => {
    test.setTimeout(180_000);

    const { login, password } = e2eUsers.manager;
    test.skip(
      !login || !password,
      "E2E_MANAGER_LOGIN and E2E_MANAGER_PASSWORD required",
    );

    await deactivateActiveTasksByName(createTaskE2ePayload.name);

    await loginAs(page, login, password);
    await page.goto("/tasks", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Gerenciar tarefas" }),
    ).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: "Nova tarefa" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByRole("textbox", { name: "Nome" });
    const qtyInput = dialog.getByLabel("Quantidade");
    const dateInput = dialog.getByLabel("Data de entrega");
    const codeInput = dialog.getByLabel("Código do modelo");

    await expect(dialog.getByLabel("Status")).toHaveCount(0);

    await expect(async () => {
      await nameInput.fill(createTaskE2ePayload.name);
      await qtyInput.fill(createTaskE2ePayload.qty);
      await dateInput.fill(createTaskE2ePayload.deliveryDate);
      await codeInput.fill(createTaskE2ePayload.templateTaskCode);

      await expect(nameInput).toHaveValue(createTaskE2ePayload.name, {
        timeout: 1_000,
      });
      await expect(qtyInput).toHaveValue(createTaskE2ePayload.qty, {
        timeout: 1_000,
      });
    }).toPass({ timeout: 40_000 });

    const taskRow = page
      .getByRole("link", {
        name: createTaskE2ePayload.name,
        exact: true,
      })
      .filter({ hasNotText: "Inativa" });

    await expect(taskRow).toHaveCount(0);

    const saveButton = dialog.getByRole("button", { name: "Salvar" });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(dialog).toBeHidden({ timeout: 90_000 });
    await expect(taskRow).toHaveCount(1, { timeout: 60_000 });

    await expect(taskRow).toContainText(createTaskE2ePayload.qty);
    await expect(taskRow).toContainText(createTaskE2ePayload.deliveryDatePtBr);
    await expect(taskRow).toContainText(createTaskE2ePayload.statusLabel);
  });
});
