/**
 * Optional credentials for authenticated E2E (set in CI or .env.local).
 * Example: E2E_MANAGER_LOGIN=douglas E2E_MANAGER_PASSWORD=secret
 */
export const e2eUsers = {
  manager: {
    login: process.env.E2E_MANAGER_LOGIN ?? "",
    password: process.env.E2E_MANAGER_PASSWORD ?? "",
  },
  colaborator: {
    login: process.env.E2E_COLABORATOR_LOGIN ?? "",
    password: process.env.E2E_COLABORATOR_PASSWORD ?? "",
  },
  kiosk: {
    login: process.env.E2E_KIOSK_LOGIN ?? "",
    password: process.env.E2E_KIOSK_PASSWORD ?? "",
  },
};

export async function loginAs(
  page: import("@playwright/test").Page,
  login: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  const usernameEntry = page.getByRole("button", {
    name: /login e senha|usuário e senha|username/i,
  });
  if (await usernameEntry.isVisible().catch(() => false)) {
    await usernameEntry.click();
  }
  await page.getByLabel(/^Login$/i).fill(login);
  const passwordField = page.getByRole("textbox", { name: /^Senha$/i });
  await passwordField.click();
  await passwordField.fill("");
  await page.keyboard.type(password, { delay: 15 });
  await page.getByRole("button", { name: /Entrar/i }).click();

  const leftLogin = page.waitForURL(
    (url) => !url.pathname.startsWith("/login"),
  );
  const authError = page
    .getByRole("alert")
    .filter({ hasText: /inválidos|invalid/i })
    .waitFor({ state: "visible" })
    .then(() => {
      throw new Error(`E2E login failed for "${login}" (invalid credentials)`);
    });

  await Promise.race([leftLogin, authError]);
}
