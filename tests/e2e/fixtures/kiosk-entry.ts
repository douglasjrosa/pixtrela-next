import type { Page } from "@playwright/test";

export async function openKioskCodePasswordStep(page: Page): Promise<void> {
  await page.getByRole("button", { name: /código e senha/i }).click();
}

export async function fillKioskPasswordField(
  page: Page,
  password: string,
): Promise<void> {
  const passwordField = page.getByRole("textbox", { name: /^Senha$/i });
  await passwordField.click();
  await passwordField.fill("");
  await page.keyboard.type(password, { delay: 15 });
}
