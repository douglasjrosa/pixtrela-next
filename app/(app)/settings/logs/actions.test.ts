import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const revalidateTag = vi.fn();
const scheduleLog = vi.fn();
const where = vi.fn();
const deleteFn = vi.fn(() => ({ where }));

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({
    delete: (...args: unknown[]) => deleteFn(...args),
  }),
}));

vi.mock("@/lib/logs/record-log", () => ({
  scheduleLog: (...args: unknown[]) => scheduleLog(...args),
  auditSuccess: (...args: unknown[]) => scheduleLog(...args),
  auditBug: (...args: unknown[]) => scheduleLog(...args),
}));

describe("deleteLogs", () => {
  beforeEach(() => {
    vi.resetModules();
    auth.mockReset();
    revalidateTag.mockReset();
    scheduleLog.mockReset();
    where.mockReset();
    deleteFn.mockClear();
    where.mockResolvedValue(undefined);
    auth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
  });

  it("deletes rows without writing another log", async () => {
    const { deleteLogs } = await import("./actions");
    await deleteLogs(["log-1"]);
    expect(deleteFn).toHaveBeenCalled();
    expect(where).toHaveBeenCalled();
    expect(scheduleLog).not.toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:logs", "default");
  });

  it("rejects callers who cannot manage settings", async () => {
    auth.mockResolvedValue({ user: { id: "mgr-1", role: "manager" } });
    const { deleteLogs } = await import("./actions");
    await expect(deleteLogs(["log-1"])).rejects.toThrow("forbidden");
    expect(deleteFn).not.toHaveBeenCalled();
    expect(scheduleLog).not.toHaveBeenCalled();
  });
});
