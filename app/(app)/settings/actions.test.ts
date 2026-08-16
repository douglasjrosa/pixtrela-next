import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const upsertCurrencyForSubtasks = vi.fn();
const upsertKioskSettings = vi.fn();
const upsertTaskAutomationSettings = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/settings", () => ({
  upsertCurrencyForSubtasks: (...args: unknown[]) =>
    upsertCurrencyForSubtasks(...args),
  upsertKioskSettings: (...args: unknown[]) => upsertKioskSettings(...args),
  upsertTaskAutomationSettings: (...args: unknown[]) =>
    upsertTaskAutomationSettings(...args),
}));

const upsertEntryAccessSettings = vi.fn();

vi.mock("@/lib/repos/entry-access", () => ({
  upsertEntryAccessSettings: (...args: unknown[]) =>
    upsertEntryAccessSettings(...args),
}));

describe("settings/actions drizzle paths", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    upsertCurrencyForSubtasks.mockReset();
    upsertKioskSettings.mockReset();
    upsertTaskAutomationSettings.mockReset();
    upsertEntryAccessSettings.mockReset();
  });

  it("updateCurrencyForSubtasks upserts and revalidates", async () => {
    const { updateCurrencyForSubtasks } = await import("./actions");
    await updateCurrencyForSubtasks({ currencyDocumentId: "cur-1" });
    expect(upsertCurrencyForSubtasks).toHaveBeenCalledWith("cur-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:currency-for-subtasks", "default");
  });

  it("updateKioskSessionIdleSeconds upserts kiosk settings", async () => {
    const { updateKioskSessionIdleSeconds } = await import("./actions");
    await updateKioskSessionIdleSeconds({
      sessionIdleSeconds: 90,
      maxSimultaneousSubtaskIntervalSeconds: 300,
    });
    expect(upsertKioskSettings).toHaveBeenCalledWith({
      sessionIdleSeconds: 90,
      maxSimultaneousSubtaskIntervalSeconds: 300,
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:kiosk-setting", "default");
  });

  it("updateTaskAutomationSetting upserts and revalidates on drizzle backend", async () => {
    const { updateTaskAutomationSetting } = await import("./actions");
    const values = {
      waitingStepDocumentId: "s1",
      producingStepDocumentId: "",
      pausedStepDocumentId: "",
      finishedStepDocumentId: "",
      reviewedStepDocumentId: "",
      deliveredStepDocumentId: "",
      assignWarnMax: 4,
    };
    await updateTaskAutomationSetting(values);
    expect(upsertTaskAutomationSettings).toHaveBeenCalledWith(values);
    expect(revalidateTag).toHaveBeenCalledWith(
      "drizzle:task-automation-setting",
      "default",
    );
  });

  it("updateEntryAccessSettings upserts login and kiosk access", async () => {
    const { updateEntryAccessSettings } = await import("./actions");
    await updateEntryAccessSettings({
      surface: "kiosk",
      computer: {
        username: true,
        code: false,
        face: false,
        nfc: false,
      },
      mobile: {
        username: false,
        code: true,
        face: true,
        nfc: false,
      },
    });
    expect(upsertEntryAccessSettings).toHaveBeenCalledWith(
      "kiosk",
      expect.objectContaining({
        computer: expect.objectContaining({ username: true }),
        mobile: expect.objectContaining({ code: true, face: true }),
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:entry-access", "default");
  });
});
