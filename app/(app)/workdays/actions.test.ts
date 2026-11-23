import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const createWorkdayRepo = vi.fn();
const updateWorkdayRepo = vi.fn();
const archiveWorkdays = vi.fn();
const reactivateWorkdays = vi.fn();
const findWorkdayById = vi.fn();
const hardDeleteWorkday = vi.fn();
const loadWorkdayListPageMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/logs/record-log", () => ({
  auditSuccess: vi.fn(async () => undefined),
}));

vi.mock("@/lib/repos/workdays", () => ({
  createWorkday: (...args: unknown[]) => createWorkdayRepo(...args),
  updateWorkday: (...args: unknown[]) => updateWorkdayRepo(...args),
  archiveWorkdays: (...args: unknown[]) => archiveWorkdays(...args),
  reactivateWorkdays: (...args: unknown[]) => reactivateWorkdays(...args),
  findWorkdayById: (...args: unknown[]) => findWorkdayById(...args),
  hardDeleteWorkday: (...args: unknown[]) => hardDeleteWorkday(...args),
}));

vi.mock("@/lib/workdays/load-workday-list-page", () => ({
  WORKDAY_LIST_CACHE_TAG: "drizzle:workdays",
  loadWorkdayListPage: (...args: unknown[]) => loadWorkdayListPageMock(...args),
}));

const VALID_FORM = {
  name: "Expediente padrão",
  description: "",
  action: "work" as const,
  scope: "global" as const,
  timezone: "America/Sao_Paulo",
  validFrom: "",
  validUntil: "",
  teamIds: [],
  userIds: [],
  slots: [
    {
      isRecurrent: true,
      dayOfWeek: 1,
      date: null,
      allDay: false,
      startMinute: 480,
      endMinute: 720,
    },
  ],
};

describe("workdays/actions", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { role: "admin" } });
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    createWorkdayRepo.mockReset();
    updateWorkdayRepo.mockReset();
    archiveWorkdays.mockReset();
    reactivateWorkdays.mockReset();
    findWorkdayById.mockReset();
    hardDeleteWorkday.mockReset();
    loadWorkdayListPageMock.mockReset();
  });

  it("blocks leader from creating workdays", async () => {
    authMock.mockResolvedValueOnce({ user: { role: "leader" } });
    const { createWorkday } = await import("./actions");
    await expect(createWorkday(VALID_FORM)).rejects.toThrow("forbidden");
    expect(createWorkdayRepo).not.toHaveBeenCalled();
  });

  it("allows manager to create and invalidates cache", async () => {
    authMock.mockResolvedValueOnce({ user: { role: "manager" } });
    const { createWorkday } = await import("./actions");
    await createWorkday(VALID_FORM);
    expect(createWorkdayRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Expediente padrão",
        action: "work",
        scope: "global",
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:workdays", "default");
    expect(revalidatePath).toHaveBeenCalledWith("/workdays");
  });

  it("blocks manager from hard deleting workdays", async () => {
    authMock.mockResolvedValueOnce({ user: { role: "manager" } });
    const { bulkDeleteWorkdays } = await import("./actions");
    await expect(bulkDeleteWorkdays(["wd-1"])).rejects.toThrow("forbidden");
    expect(hardDeleteWorkday).not.toHaveBeenCalled();
  });

  it("allows admin to hard delete archived workdays", async () => {
    findWorkdayById.mockResolvedValueOnce({
      id: "wd-1",
      name: "Antigo",
      active: false,
    });
    const { bulkDeleteWorkdays } = await import("./actions");
    await bulkDeleteWorkdays(["wd-1"]);
    expect(hardDeleteWorkday).toHaveBeenCalledWith("wd-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:workdays", "default");
  });

  it("rejects hard delete when workday is still active", async () => {
    findWorkdayById.mockResolvedValueOnce({
      id: "wd-1",
      name: "Ativo",
      active: true,
    });
    const { bulkDeleteWorkdays } = await import("./actions");
    await expect(bulkDeleteWorkdays(["wd-1"])).rejects.toThrow("activeWorkday");
    expect(hardDeleteWorkday).not.toHaveBeenCalled();
  });

  it("archives selected workdays with a valid reason", async () => {
    findWorkdayById.mockResolvedValueOnce({
      id: "wd-1",
      name: "Padrão",
      active: true,
    });
    const { bulkArchiveWorkdays } = await import("./actions");
    await bulkArchiveWorkdays(
      ["wd-1"],
      "Horário substituído pelo novo expediente de produção.",
    );
    expect(archiveWorkdays).toHaveBeenCalledWith(
      ["wd-1"],
      "Horário substituído pelo novo expediente de produção.",
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:workdays", "default");
  });
});
