import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const upsertCurrencyForSubtasks = vi.fn();
const upsertKioskSettings = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => true,
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/settings", () => ({
  upsertCurrencyForSubtasks: (...args: unknown[]) =>
    upsertCurrencyForSubtasks(...args),
  upsertKioskSettings: (...args: unknown[]) => upsertKioskSettings(...args),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: {},
  strapiFetch: vi.fn(),
}));

describe("settings/actions drizzle paths", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    upsertCurrencyForSubtasks.mockReset();
    upsertKioskSettings.mockReset();
  });

  it("updateCurrencyForSubtasks upserts and revalidates", async () => {
    const { updateCurrencyForSubtasks } = await import("./actions");
    await updateCurrencyForSubtasks({ currencyDocumentId: "cur-1" });
    expect(upsertCurrencyForSubtasks).toHaveBeenCalledWith("cur-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:currency-for-subtasks");
  });

  it("updateKioskSessionIdleSeconds upserts kiosk settings", async () => {
    const { updateKioskSessionIdleSeconds } = await import("./actions");
    await updateKioskSessionIdleSeconds(90);
    expect(upsertKioskSettings).toHaveBeenCalledWith(90);
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:kiosk-setting");
  });

  it("updateTaskAutomationSetting rejects on drizzle backend", async () => {
    const { updateTaskAutomationSetting } = await import("./actions");
    await expect(
      updateTaskAutomationSetting({
        waitingStepDocumentId: "s1",
        producingStepDocumentId: "",
        pausedStepDocumentId: "",
        finishedStepDocumentId: "",
        reviewedStepDocumentId: "",
        deliveredStepDocumentId: "",
      }),
    ).rejects.toThrow("task_automation_drizzle_pending");
  });
});
