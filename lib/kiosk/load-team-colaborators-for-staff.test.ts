import { beforeEach, describe, expect, it, vi } from "vitest";

const loadStaffQueuesGrouped = vi.fn();
const listUsersByRole = vi.fn();
const findUserById = vi.fn();
const findUserFacePhotoUrl = vi.fn();

vi.mock("@/lib/kiosk/load-staff-queues-grouped", () => ({
  loadStaffQueuesGrouped: (...args: unknown[]) =>
    loadStaffQueuesGrouped(...args),
}));

vi.mock("@/lib/repos/users", () => ({
  listUsersByRole: (...args: unknown[]) => listUsersByRole(...args),
  findUserById: (...args: unknown[]) => findUserById(...args),
  findUserFacePhotoUrl: (...args: unknown[]) => findUserFacePhotoUrl(...args),
}));

describe("loadTeamColaboratorsForStaff", () => {
  beforeEach(() => {
    loadStaffQueuesGrouped.mockReset();
    listUsersByRole.mockReset();
    findUserById.mockReset();
    findUserFacePhotoUrl.mockReset();
    vi.resetModules();
  });

  it("scopes a leader to team colaborators and appends self last", async () => {
    loadStaffQueuesGrouped.mockResolvedValue({
      teams: [
        {
          teamId: "t1",
          teamName: "Alpha",
          members: [
            { documentId: "c1", name: "Ana", code: 1, facePhotoUrl: null },
            {
              documentId: "lead-1",
              name: "Lia",
              code: 9,
              facePhotoUrl: null,
              isLeader: true,
            },
          ],
        },
      ],
    });
    findUserById.mockResolvedValue({
      id: "lead-1",
      name: "Lia",
      code: 9,
      active: true,
      blocked: false,
    });
    findUserFacePhotoUrl.mockResolvedValue(null);

    const { loadTeamColaboratorsForStaff } = await import(
      "./load-team-colaborators-for-staff"
    );
    const rows = await loadTeamColaboratorsForStaff("lead-1", "leader", {} as never);
    expect(rows.map((row) => row.documentId)).toEqual(["c1", "lead-1"]);
  });
});
