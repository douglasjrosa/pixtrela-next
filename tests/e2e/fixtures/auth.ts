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
  await page.getByLabel(/Login/i).fill(login);
  await page.getByLabel(/Senha/i).fill(password);
  await page.getByRole("button", { name: /Entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}
