import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const auth = vi.fn();
const createActivityRepo = vi.fn();
const updateActivityFields = vi.fn();
const archiveActivities = vi.fn();
const deleteActivityById = vi.fn();
const getActivityById = vi.fn();
const reactivateActivityRepo = vi.fn();
const loadActivityListPage = vi.fn();
const findLatestDeactivationReason = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/activities", () => ({
  createActivity: (...args: unknown[]) => createActivityRepo(...args),
  updateActivityFields: (...args: unknown[]) => updateActivityFields(...args),
  archiveActivities: (...args: unknown[]) => archiveActivities(...args),
  deleteActivityById: (...args: unknown[]) => deleteActivityById(...args),
  getActivityById: (...args: unknown[]) => getActivityById(...args),
  reactivateActivity: (...args: unknown[]) => reactivateActivityRepo(...args),
}));

vi.mock("@/lib/activities/load-activity-list-page", () => ({
  loadActivityListPage: (...args: unknown[]) => loadActivityListPage(...args),
}));

vi.mock("@/lib/repos/deactivation-reasons", () => ({
  findLatestDeactivationReason: (...args: unknown[]) =>
    findLatestDeactivationReason(...args),
}));

const FORM = {
  colaboratorId: "11111111-1111-4111-8111-111111111111",
  subTaskId: "22222222-2222-4222-8222-222222222222",
  action: "started" as const,
  date: "2026-09-21",
  time: "15:32",
  qty: 2,
};

describe("activities actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    auth.mockReset();
    createActivityRepo.mockReset();
    updateActivityFields.mockReset();
    archiveActivities.mockReset();
    deleteActivityById.mockReset();
    getActivityById.mockReset();
    reactivateActivityRepo.mockReset();
    loadActivityListPage.mockReset();
    findLatestDeactivationReason.mockReset();
    auth.mockResolvedValue({ user: { role: "admin" } });
  });

  it("rejects non-admin callers", async () => {
    auth.mockResolvedValue({ user: { role: "manager" } });
    const { createActivity } = await import("./actions");
    await expect(createActivity(FORM)).rejects.toThrow("forbidden");
    expect(createActivityRepo).not.toHaveBeenCalled();
  });

  it("creates an activity and revalidates caches", async () => {
    const { createActivity } = await import("./actions");
    await createActivity(FORM);
    expect(createActivityRepo).toHaveBeenCalledWith(FORM);
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:activities", "default");
  });

  it("refuses to delete an active activity", async () => {
    getActivityById.mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      active: true,
    });
    const { bulkDeleteActivities } = await import("./actions");
    await expect(
      bulkDeleteActivities(["33333333-3333-4333-8333-333333333333"]),
    ).rejects.toThrow("activeActivity");
    expect(deleteActivityById).not.toHaveBeenCalled();
  });
});
