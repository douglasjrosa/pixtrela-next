import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: {
    currencies: "strapi:currencies",
    kioskSetting: "strapi:kiosk-setting",
    taskAutomationSetting: "strapi:task-automation-setting",
    tasks: "strapi:tasks",
  },
  strapiFetch,
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags,
}));

vi.mock("@/lib/strapi/kiosk-setting", () => ({
  KIOSK_SETTING_API_PATH: "/kiosk-setting",
}));

vi.mock("@/lib/strapi/task-automation-setting", () => ({
  TASK_AUTOMATION_SETTING_API_PATH: "/task-automation-setting",
  toTaskAutomationSettingPayload: (values: {
    waitingStepDocumentId: string;
    producingStepDocumentId: string;
    pausedStepDocumentId: string;
    finishedStepDocumentId: string;
  }) => ({
    waitingStep: values.waitingStepDocumentId || null,
    producingStep: values.producingStepDocumentId || null,
    pausedStep: values.pausedStepDocumentId || null,
    finishedStep: values.finishedStepDocumentId || null,
  }),
}));

function mockStrapiFetch(
  handlers: Record<string, unknown>,
): void {
  strapiFetch.mockImplementation(
    async (path: string, init?: { method?: string }) => {
      const method = init?.method ?? "GET";
      const key = `${method} ${path}`;
      if (key in handlers) {
        return handlers[key];
      }
      if (path in handlers) {
        return handlers[path];
      }
      throw new Error(`Unexpected strapiFetch: ${key}`);
    },
  );
}

describe("settings/actions", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    vi.resetModules();
  });

  it("updateKioskSessionIdleSeconds PUTs singular single-type path", async () => {
    mockStrapiFetch({
      "PUT /kiosk-setting": { data: { sessionIdleSeconds: 15 } },
    });

    const { updateKioskSessionIdleSeconds } = await import("./actions");
    await updateKioskSessionIdleSeconds(15);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/kiosk-setting",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: { sessionIdleSeconds: 15 } }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:kiosk-setting");
  });

  it("updateCurrencyRates PUTs each currency document path", async () => {
    mockStrapiFetch({
      "PUT /currencies/cur-1": { data: { documentId: "cur-1" } },
      "PUT /currencies/cur-2": { data: { documentId: "cur-2" } },
    });

    const { updateCurrencyRates } = await import("./actions");
    await updateCurrencyRates([
      { documentId: "cur-1", currencyPerSecond: 2 },
      { documentId: "cur-2", currencyPerSecond: 0.75 },
    ]);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/currencies/cur-1",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(strapiFetch).toHaveBeenCalledWith(
      "/currencies/cur-2",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:currencies");
  });

  it("updateTaskAutomationSetting PUTs single-type path", async () => {
    mockStrapiFetch({
      "PUT /task-automation-setting": { data: { documentId: "auto-1" } },
    });

    const { updateTaskAutomationSetting } = await import("./actions");
    await updateTaskAutomationSetting({
      waitingStepDocumentId: "step-1",
      producingStepDocumentId: "step-2",
      pausedStepDocumentId: "",
      finishedStepDocumentId: "step-4",
    });

    expect(strapiFetch).toHaveBeenCalledWith(
      "/task-automation-setting",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          data: {
            waitingStep: "step-1",
            producingStep: "step-2",
            pausedStep: null,
            finishedStep: "step-4",
          },
        }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith(
      "strapi:task-automation-setting",
      "strapi:tasks",
    );
  });
});
