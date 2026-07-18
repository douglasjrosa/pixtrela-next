import { expect, type Page } from "@playwright/test";

const SERVER_ERROR_COPY = /Internal Server Error|Application error/i;

/**
 * Visits a path and asserts the authenticated shell rendered without a 5xx
 * or uncaught client exception (the class of bug Vitest RSC unit tests miss).
 */
export async function assertShellRouteLoads(
  page: Page,
  path: string,
): Promise<void> {
  const pageErrors: string[] = [];
  const onPageError = (error: Error): void => {
    pageErrors.push(error.message);
  };
  page.on("pageerror", onPageError);

  try {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response, `expected a response for ${path}`).toBeTruthy();
    expect(
      response!.status(),
      `${path} returned HTTP ${response!.status()}`,
    ).toBeLessThan(500);

    await expect(page.locator("main")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(SERVER_ERROR_COPY)).toHaveCount(0);
    expect(
      pageErrors,
      `pageerror on ${path}: ${pageErrors.join(" | ")}`,
    ).toEqual([]);
  } finally {
    page.off("pageerror", onPageError);
  }
}
