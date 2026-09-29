import { beforeEach, describe, expect, it, vi } from "vitest";

const persistLog = vi.fn();
const after = vi.fn();

vi.mock("next/server", () => ({
  after: (...args: unknown[]) => after(...args),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
}));

vi.mock("@/lib/logs/log-store", () => ({
  drizzleLogStore: () => ({
    findRecent: vi.fn(),
    insert: vi.fn(),
    increment: vi.fn(),
  }),
}));

vi.mock("@/lib/logs/persist-log", () => ({
  persistLog: (...args: unknown[]) => persistLog(...args),
  runScheduledLog: vi.fn(),
}));

describe("auditBug immediate", () => {
  beforeEach(() => {
    persistLog.mockReset();
    after.mockReset();
    persistLog.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("persists the message before returning and mirrors it to stderr", async () => {
    const { auditBug } = await import("./record-log");
    const error = new Error("duplicate key value violates unique constraint");
    await auditBug({
      route: "/api/tasks",
      operation: "crm.upsert",
      error,
      immediate: true,
      ids: { externalKey: "123:0", templateTaskCode: "17426" },
    });

    expect(after).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("duplicate key value violates unique constraint"),
      error,
    );
    expect(persistLog).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/tasks",
        dedupe: false,
        detail: expect.stringContaining("externalKey=123:0"),
      }),
      expect.anything(),
    );
  });
});
