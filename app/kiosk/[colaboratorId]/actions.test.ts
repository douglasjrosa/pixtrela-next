import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const startSubTaskRepo = vi.fn();
const stopSubTaskRepo = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "kiosk" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/kiosk-subtasks", () => ({
  listAssignedSubTasks: vi.fn(),
  startSubTask: (...args: unknown[]) => startSubTaskRepo(...args),
  stopSubTask: (...args: unknown[]) => stopSubTaskRepo(...args),
}));

describe("kiosk/[colaboratorId]/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    startSubTaskRepo.mockReset();
    stopSubTaskRepo.mockReset();
  });

  it("startSubTask delegates to repo and revalidates drizzle tags", async () => {
    startSubTaskRepo.mockResolvedValue(undefined);

    const { startSubTask } = await import("./actions");
    await startSubTask("col-1", "sub-1");

    expect(startSubTaskRepo).toHaveBeenCalledWith("col-1", "sub-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:activities", "default");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:subTasks", "default");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:balances", "default");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:tasks", "default");
  });

  it("exitSubTask delegates to stopSubTask repo with duration payload", async () => {
    stopSubTaskRepo.mockResolvedValue({ remainingWorkerNames: ["Ana"] });

    const { exitSubTask } = await import("./actions");
    const result = await exitSubTask(
      "col-1",
      "sub-1",
      "duration",
      { sharingType: "duration", isCompleted: true },
      1,
      0,
    );

    expect(stopSubTaskRepo).toHaveBeenCalledWith("col-1", "sub-1", {
      completed: true,
    });
    expect(result).toEqual({ remainingWorkerNames: ["Ana"] });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:activities", "default");
  });

  it("exitSubTask delegates qty payload to stopSubTask repo", async () => {
    stopSubTaskRepo.mockResolvedValue({ remainingWorkerNames: [] });

    const { exitSubTask } = await import("./actions");
    await exitSubTask(
      "col-1",
      "sub-1",
      "qty",
      { sharingType: "qty", qtyCompleted: 3 },
      10,
      2,
    );

    expect(stopSubTaskRepo).toHaveBeenCalledWith("col-1", "sub-1", { qty: 3 });
  });
});
