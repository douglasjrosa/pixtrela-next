import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUserById = vi.fn();
const assertStaffCanManageColaborator = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("@/lib/repos/users", () => ({
  findUserById: (...args: unknown[]) => findUserById(...args),
}));

vi.mock("@/lib/repos/kiosk", () => ({
  assertStaffCanManageColaborator: (...args: unknown[]) =>
    assertStaffCanManageColaborator(...args),
}));

describe("kiosk-staff-access", () => {
  beforeEach(() => {
    auth.mockReset();
    findUserById.mockReset();
    assertStaffCanManageColaborator.mockReset();
    vi.resetModules();
  });

  it("canKioskSignOutDevice only for admin and manager", async () => {
    const { canKioskSignOutDevice } = await import("./kiosk-staff-access");
    expect(canKioskSignOutDevice("admin")).toBe(true);
    expect(canKioskSignOutDevice("manager")).toBe(true);
    expect(canKioskSignOutDevice("leader")).toBe(false);
    expect(canKioskSignOutDevice("colaborator")).toBe(false);
  });

  it("assertKioskStaffActor rejects non-kiosk session", async () => {
    auth.mockResolvedValue({ user: { role: "leader" } });
    const { assertKioskStaffActor } = await import("./kiosk-staff-access");
    await expect(assertKioskStaffActor("lead-1")).rejects.toThrow("forbidden");
  });

  it("assertKioskStaffActor accepts kiosk device + leader staff", async () => {
    auth.mockResolvedValue({ user: { role: "kiosk" } });
    findUserById.mockResolvedValue({
      id: "lead-1",
      role: "leader",
      name: "Lead",
      avatarUrl: null,
      active: true,
      blocked: false,
    });
    const { assertKioskStaffActor } = await import("./kiosk-staff-access");
    await expect(assertKioskStaffActor("lead-1")).resolves.toMatchObject({
      staffUserId: "lead-1",
      staffRole: "leader",
      name: "Lead",
    });
  });

  it("staff path helpers build expected URLs", async () => {
    const {
      kioskStaffNavPaths,
      staffBoardPath,
      staffTasksPath,
      staffQueuesPath,
      staffQueueColaboratorPath,
      staffProfilePath,
      staffActivitiesPath,
    } = await import("./kiosk-staff-paths");
    expect(staffBoardPath("u1")).toBe("/kiosk/staff/u1/board");
    expect(staffTasksPath("u1")).toBe("/kiosk/staff/u1/tasks");
    expect(staffQueuesPath("u1")).toBe("/kiosk/staff/u1/queues");
    expect(staffActivitiesPath("u1")).toBe("/kiosk/staff/u1/activities");
    expect(staffQueueColaboratorPath("u1", "c1")).toBe(
      "/kiosk/staff/u1/queues/c1",
    );
    expect(staffProfilePath("u1")).toBe("/kiosk/staff/u1/profile");
    expect(kioskStaffNavPaths("u1").tasks).toBe("/kiosk/staff/u1/tasks");
  });
});
