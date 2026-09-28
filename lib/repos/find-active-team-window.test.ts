import { beforeEach, describe, expect, it, vi } from "vitest";

const loadLeaderExchangeWindow = vi.fn();

vi.mock("@/lib/repos/settings", () => ({
  loadLeaderExchangeWindow: (...args: unknown[]) =>
    loadLeaderExchangeWindow(...args),
}));

describe("findActiveTeamWindowForUser", () => {
  beforeEach(() => {
    loadLeaderExchangeWindow.mockReset();
  });

  it("uses leader exchange settings for leader role", async () => {
    loadLeaderExchangeWindow.mockResolvedValue({
      exchangesFirstDay: 5,
      exchangesLastDay: 20,
    });

    const leaderId = "11111111-1111-1111-1111-111111111111";
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([{ role: "leader" }]),
          }),
        }),
      }),
    };

    const { findActiveTeamWindowForUser } = await import("./teams");
    const window = await findActiveTeamWindowForUser(
      leaderId,
      db as never,
    );

    expect(loadLeaderExchangeWindow).toHaveBeenCalledWith(db);
    expect(window).toEqual({ exchangesFirstDay: 5, exchangesLastDay: 20 });
  });
});
