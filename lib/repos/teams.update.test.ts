import { beforeEach, describe, expect, it, vi } from "vitest";

const returning = vi.fn();
const where = vi.fn().mockReturnValue({ returning });
const set = vi.fn().mockReturnValue({ where });
const update = vi.fn().mockReturnValue({ set });
const deleteMembers = vi.fn().mockResolvedValue(undefined);
const insertMembers = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({
    update,
    delete: vi.fn().mockReturnValue({ where: deleteMembers }),
    insert: vi.fn().mockReturnValue({ values: insertMembers }),
  }),
}));

describe("updateTeam", () => {
  beforeEach(() => {
    update.mockClear();
    set.mockClear();
    where.mockClear();
    returning.mockReset();
    returning.mockResolvedValue([
      {
        id: "team-1",
        name: "Linha 1",
        leaderId: null,
        exchangesFirstDay: 3,
        exchangesLastDay: 15,
        since: "2026-01-01",
        until: "2026-08-16",
        active: false,
      },
    ]);
  });

  it("sets active false when until is defined", async () => {
    const { updateTeam } = await import("./teams");
    await updateTeam({
      id: "team-1",
      name: "Linha 1",
      exchangesFirstDay: 3,
      exchangesLastDay: 15,
      until: "2026-08-16",
    });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        until: "2026-08-16",
        active: false,
      }),
    );
  });

  it("sets active true when until is cleared", async () => {
    returning.mockResolvedValueOnce([
      {
        id: "team-1",
        name: "Linha 1",
        leaderId: null,
        exchangesFirstDay: 3,
        exchangesLastDay: 15,
        since: "2026-01-01",
        until: null,
        active: true,
      },
    ]);
    const { updateTeam } = await import("./teams");
    await updateTeam({
      id: "team-1",
      name: "Linha 1",
      exchangesFirstDay: 3,
      exchangesLastDay: 15,
      until: null,
    });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        until: null,
        active: true,
      }),
    );
  });
});
