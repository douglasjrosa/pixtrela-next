import { beforeEach, describe, expect, it, vi } from "vitest";

const archiveRecords = vi.fn();

vi.mock("@/lib/repos/deactivation-reasons", () => ({
  archiveRecords: (...args: unknown[]) => archiveRecords(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({}),
}));

vi.mock("@/lib/business/datetime-timezone", () => ({
  toCalendarDateKey: () => "2026-08-16",
}));

describe("deleteTeam", () => {
  beforeEach(() => {
    archiveRecords.mockReset();
    archiveRecords.mockResolvedValue({ id: "reason-1" });
  });

  it("archives via shared reason and sets until to today", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    const update = vi.fn().mockReturnValue({ set });
    const tx = { update };

    const { deleteTeam } = await import("./teams");
    await deleteTeam("team-1", "x".repeat(100));

    expect(archiveRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        tableName: "teams",
        recordIds: ["team-1"],
        text: "x".repeat(100),
      }),
      expect.anything(),
    );

    const input = archiveRecords.mock.calls[0]?.[0] as {
      setInactive: (ids: string[], txDb: unknown) => Promise<void>;
    };
    await input.setInactive(["team-1"], tx);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        active: false,
        until: "2026-08-16",
      }),
    );
    expect(where).toHaveBeenCalled();
  });
});
