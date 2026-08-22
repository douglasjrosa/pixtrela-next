import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const upsertCurrencyForSubtasks = vi.fn();
const upsertKioskSettings = vi.fn();
const upsertTaskAutomationSettings = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
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
    revalidatePath.mockReset();
    redirect.mockReset();
    upsertCurrencyForSubtasks.mockReset();
    upsertKioskSettings.mockReset();
    upsertTaskAutomationSettings.mockReset();
    upsertEntryAccessSettings.mockReset();
  });

  it("updateCurrencyForSubtasks upserts and revalidates", async () => {
    const { updateCurrencyForSubtasks } = await import("./actions");
    const formData = new FormData();
    formData.set("currencyDocumentId", "cur-1");
    await updateCurrencyForSubtasks(formData);
    expect(upsertCurrencyForSubtasks).toHaveBeenCalledWith("cur-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:currency-for-subtasks", "default");
    expect(revalidatePath).toHaveBeenCalledWith("/settings/currency");
    expect(redirect).toHaveBeenCalledWith("/settings/currency");
  });

  it("updateKioskSessionIdleSeconds upserts kiosk settings", async () => {
    const { updateKioskSessionIdleSeconds } = await import("./actions");
    const formData = new FormData();
    formData.set("sessionIdleSeconds", "90");
    formData.set("maxSimultaneousSubtaskIntervalSeconds", "300");
    await updateKioskSessionIdleSeconds(formData);
    expect(upsertKioskSettings).toHaveBeenCalledWith({
      sessionIdleSeconds: 90,
      maxSimultaneousSubtaskIntervalSeconds: 300,
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:kiosk-setting", "default");
    expect(revalidatePath).toHaveBeenCalledWith("/settings/kiosk");
    expect(redirect).toHaveBeenCalledWith("/settings/kiosk");
  });

  it("updateTaskAutomationSetting upserts and revalidates on drizzle backend", async () => {
    const { updateTaskAutomationSetting } = await import("./actions");
    const formData = new FormData();
    formData.set("waitingStepDocumentId", "s1");
    formData.set("producingStepDocumentId", "");
    formData.set("pausedStepDocumentId", "");
    formData.set("finishedStepDocumentId", "");
    formData.set("reviewedStepDocumentId", "");
    formData.set("deliveredStepDocumentId", "");
    formData.set("assignWarnMax", "4");
    const values = {
      waitingStepDocumentId: "s1",
      producingStepDocumentId: "",
      pausedStepDocumentId: "",
      finishedStepDocumentId: "",
      reviewedStepDocumentId: "",
      deliveredStepDocumentId: "",
      assignWarnMax: 4,
    };
    await updateTaskAutomationSetting(formData);
    expect(upsertTaskAutomationSettings).toHaveBeenCalledWith(values);
    expect(revalidateTag).toHaveBeenCalledWith(
      "drizzle:task-automation-setting",
      "default",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/settings/automations");
    expect(redirect).toHaveBeenCalledWith("/settings/automations");
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
