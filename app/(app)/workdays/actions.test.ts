import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const createWorkdayRepo = vi.fn();
const updateWorkdayRepo = vi.fn();
const archiveWorkdays = vi.fn();
const reactivateWorkdays = vi.fn();
const findWorkdayById = vi.fn();
const findWorkdayWithRelations = vi.fn();
const hardDeleteWorkday = vi.fn();
const loadWorkdayListPageMock = vi.fn();
const replayWorkdayDurationCredits = vi.fn();
const resolveWorkdayViewerContext = vi.fn();

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

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({}),
}));

vi.mock("@/lib/repos/workday-credit-replay", () => ({
  replayWorkdayDurationCredits: (...args: unknown[]) =>
    replayWorkdayDurationCredits(...args),
}));

vi.mock("@/lib/workdays/resolve-workday-viewer", () => ({
  resolveWorkdayViewerContext: (...args: unknown[]) =>
    resolveWorkdayViewerContext(...args),
}));

vi.mock("@/lib/repos/workdays", () => ({
  createWorkday: (...args: unknown[]) => createWorkdayRepo(...args),
  updateWorkday: (...args: unknown[]) => updateWorkdayRepo(...args),
  archiveWorkdays: (...args: unknown[]) => archiveWorkdays(...args),
  reactivateWorkdays: (...args: unknown[]) => reactivateWorkdays(...args),
  findWorkdayById: (...args: unknown[]) => findWorkdayById(...args),
  findWorkdayWithRelations: (...args: unknown[]) =>
    findWorkdayWithRelations(...args),
  hardDeleteWorkday: (...args: unknown[]) => hardDeleteWorkday(...args),
  toWorkdayPolicySnapshot: (row: { action: string }) => row,
}));

vi.mock("@/lib/workdays/load-workday-list-page", () => ({
  WORKDAY_LIST_CACHE_TAG: "drizzle:workdays",
  loadWorkdayListPage: (...args: unknown[]) => loadWorkdayListPageMock(...args),
}));

const WRITE_CONTEXT = {
  role: "manager" as const,
  todayIso: "2026-11-24",
  allowedUserIds: null,
};

const VALID_FORM = {
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
      startMinute: 480,
      endMinute: 720,
    },
  ],
};

describe("workdays/actions", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    createWorkdayRepo.mockReset();
    updateWorkdayRepo.mockReset();
    archiveWorkdays.mockReset();
    reactivateWorkdays.mockReset();
    findWorkdayById.mockReset();
    findWorkdayWithRelations.mockReset();
    hardDeleteWorkday.mockReset();
    loadWorkdayListPageMock.mockReset();
    replayWorkdayDurationCredits.mockReset();
    resolveWorkdayViewerContext.mockReset();
    resolveWorkdayViewerContext.mockResolvedValue({
      role: "admin",
      viewer: null,
      writeContext: WRITE_CONTEXT,
    });
    createWorkdayRepo.mockResolvedValue({ id: "wd-1" });
    findWorkdayWithRelations.mockResolvedValue({
      id: "wd-1",
      action: "work",
      active: true,
      slots: [],
      users: [],
      teams: [],
    });
  });

  it("blocks leader from creating factory work scale", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "lead-1", role: "leader" } });
    resolveWorkdayViewerContext.mockResolvedValueOnce({
      role: "leader",
      viewer: { role: "leader", userId: "lead-1", teamIds: [], userIds: [] },
      writeContext: {
        role: "leader",
        todayIso: "2026-11-24",
        allowedUserIds: [],
      },
    });
    const { createWorkday } = await import("./actions");
    await expect(createWorkday(VALID_FORM)).rejects.toThrow("forbiddenAction");
    expect(createWorkdayRepo).not.toHaveBeenCalled();
  });

  it("allows manager to create and invalidates cache", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "mgr-1", role: "manager" } });
    resolveWorkdayViewerContext.mockResolvedValueOnce({
      role: "manager",
      viewer: null,
      writeContext: WRITE_CONTEXT,
    });
    const { createWorkday } = await import("./actions");
    await createWorkday(VALID_FORM);
    expect(createWorkdayRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "work",
        scope: "global",
        actorUserId: "mgr-1",
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:workdays", "default");
    expect(revalidatePath).toHaveBeenCalledWith("/workdays");
  });

  it("blocks manager from hard deleting workdays", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "mgr-1", role: "manager" } });
    const { bulkDeleteWorkdays } = await import("./actions");
    await expect(bulkDeleteWorkdays(["wd-1"])).rejects.toThrow("forbidden");
    expect(hardDeleteWorkday).not.toHaveBeenCalled();
  });

  it("allows admin to hard delete archived workdays", async () => {
    findWorkdayById.mockResolvedValueOnce({
      id: "wd-1",
      action: "work",
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
      action: "work",
      active: true,
    });
    const { bulkDeleteWorkdays } = await import("./actions");
    await expect(bulkDeleteWorkdays(["wd-1"])).rejects.toThrow("activeWorkday");
    expect(hardDeleteWorkday).not.toHaveBeenCalled();
  });

  it("archives selected workdays with a valid reason", async () => {
    findWorkdayWithRelations.mockResolvedValueOnce({
      id: "wd-1",
      action: "work",
      active: true,
      slots: [],
      users: [],
      teams: [],
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
