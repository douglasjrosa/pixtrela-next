import { beforeEach, describe, expect, it, vi } from "vitest";

const loadStaffQueuesGrouped = vi.fn();
const listUsersByRole = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/kiosk/load-staff-queues-grouped", () => ({
  loadStaffQueuesGrouped: (...args: unknown[]) =>
    loadStaffQueuesGrouped(...args),
}));

vi.mock("@/lib/repos/users", () => ({
  listUsersByRole: (...args: unknown[]) => listUsersByRole(...args),
}));

vi.mock("@/lib/repos/kiosk", () => ({
  assertStaffCanManageColaborator: vi.fn(),
}));

describe("loadColaboratorOptionsForStaff", () => {
  beforeEach(() => {
    loadStaffQueuesGrouped.mockReset();
    listUsersByRole.mockReset();
    vi.resetModules();
  });

  it("returns empty for non-staff roles", async () => {
    const { loadColaboratorOptionsForStaff } = await import(
      "./load-colaborator-options-for-staff"
    );
    await expect(
      loadColaboratorOptionsForStaff("colaborator", "u1"),
    ).resolves.toEqual([]);
    expect(loadStaffQueuesGrouped).not.toHaveBeenCalled();
  });

  it("scopes leader options to their team members (deduped)", async () => {
    loadStaffQueuesGrouped.mockResolvedValue({
      teams: [
        {
          teamId: "t1",
          teamName: "Alpha",
          members: [
            { documentId: "c1", name: "Ana", code: 1 },
            { documentId: "c2", name: "Bruno", code: 2 },
          ],
        },
        {
          teamId: "t2",
          teamName: "Beta",
          members: [{ documentId: "c1", name: "Ana", code: 1 }],
        },
      ],
    });
    const { loadColaboratorOptionsForStaff } = await import(
      "./load-colaborator-options-for-staff"
    );
    const options = await loadColaboratorOptionsForStaff("leader", "lead-1");
    expect(loadStaffQueuesGrouped).toHaveBeenCalledWith("lead-1", "leader");
    expect(options).toEqual([
      { documentId: "c1", name: "Ana", code: 1 },
      { documentId: "c2", name: "Bruno", code: 2 },
    ]);
  });

  it("returns all active colaborators for manager+", async () => {
    listUsersByRole.mockResolvedValue([
      { id: "c1", name: "Ana", code: 1, active: true, blocked: false },
      { id: "c2", name: "Off", code: 2, active: false, blocked: false },
      { id: "c3", name: "Blocked", code: 3, active: true, blocked: true },
    ]);
    const { loadColaboratorOptionsForStaff } = await import(
      "./load-colaborator-options-for-staff"
    );
    const options = await loadColaboratorOptionsForStaff("manager", "mgr-1");
    expect(listUsersByRole).toHaveBeenCalledWith("colaborator");
    expect(options).toEqual([{ documentId: "c1", name: "Ana", code: 1 }]);
  });
});
