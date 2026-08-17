import { beforeEach, describe, expect, it, vi } from "vitest";

const where = vi.fn().mockResolvedValue(undefined);
const set = vi.fn().mockReturnValue({ where });
const update = vi.fn().mockReturnValue({ set });

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({ update }),
}));

vi.mock("@/lib/business/datetime-timezone", () => ({
  toCalendarDateKey: () => "2026-08-16",
}));

describe("deleteTeam", () => {
  beforeEach(() => {
    update.mockClear();
    set.mockClear();
    where.mockClear();
  });

  it("sets active false and until to today when archiving", async () => {
    const { deleteTeam } = await import("./teams");
    await deleteTeam("team-1");
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        active: false,
        until: "2026-08-16",
      }),
    );
    expect(where).toHaveBeenCalled();
  });
});
