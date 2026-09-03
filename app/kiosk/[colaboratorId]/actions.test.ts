import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const listKioskQueueSectionPageRepo = vi.fn();
const startSubTaskRepo = vi.fn();
const stopSubTaskRepo = vi.fn();
const startChainRepo = vi.fn();
const advanceChainRunRepo = vi.fn();
const confirmChainStopRepo = vi.fn();
const joinLiveChainRepo = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "kiosk" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/kiosk/load-session-idle", () => ({
  loadKioskLiveChainIntervalSeconds: vi.fn(async () => 300),
}));

vi.mock("@/lib/repos/kiosk-subtasks", () => ({
  listAssignedSubTasks: vi.fn(),
  listKioskQueueSectionPage: (...args: unknown[]) =>
    listKioskQueueSectionPageRepo(...args),
  startSubTask: (...args: unknown[]) => startSubTaskRepo(...args),
  stopSubTask: (...args: unknown[]) => stopSubTaskRepo(...args),
}));

vi.mock("@/lib/repos/material-flags", () => ({
  releaseMaterialFlag: vi.fn(),
  refreshKioskMaterialFlags: vi.fn(),
}));

vi.mock("@/lib/repos/kiosk-chains", () => ({
  startChain: (...args: unknown[]) => startChainRepo(...args),
  advanceChainRun: (...args: unknown[]) => advanceChainRunRepo(...args),
  confirmChainStop: (...args: unknown[]) => confirmChainStopRepo(...args),
  joinLiveChain: (...args: unknown[]) => joinLiveChainRepo(...args),
}));

describe("kiosk/[colaboratorId]/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    listKioskQueueSectionPageRepo.mockReset();
    startSubTaskRepo.mockReset();
    stopSubTaskRepo.mockReset();
    startChainRepo.mockReset();
    advanceChainRunRepo.mockReset();
    confirmChainStopRepo.mockReset();
    joinLiveChainRepo.mockReset();
  });

  it("fetchKioskQueueSectionPage delegates to repo", async () => {
    listKioskQueueSectionPageRepo.mockResolvedValue({
      section: "liberadas",
      producingUnits: [],
      units: [],
      nextCursor: null,
      hasMore: false,
      openRuns: [],
      subTasks: [],
      catalog: [],
      queuePageSize: 15,
    });
    const { fetchKioskQueueSectionPage } = await import("./actions");
    const result = await fetchKioskQueueSectionPage({
      colaboratorId: "col-1",
      section: "liberadas",
    });
    expect(listKioskQueueSectionPageRepo).toHaveBeenCalledWith({
      colaboratorId: "col-1",
      section: "liberadas",
      cursor: undefined,
      liveChainIntervalSeconds: 300,
    });
    expect(result.section).toBe("liberadas");
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

  it("exitSubTask accepts zero completed qty", async () => {
    stopSubTaskRepo.mockResolvedValue({ remainingWorkerNames: [] });

    const { exitSubTask } = await import("./actions");
    await exitSubTask(
      "col-1",
      "sub-1",
      "qty",
      { sharingType: "qty", qtyCompleted: 0 },
      10,
      2,
    );

    expect(stopSubTaskRepo).toHaveBeenCalledWith("col-1", "sub-1", { qty: 0 });
  });

  it("startChain delegates to repo and revalidates", async () => {
    startChainRepo.mockResolvedValue({ chainRunId: "run-1" });
    const { startChain } = await import("./actions");
    await startChain("col-1", "head-1");
    expect(startChainRepo).toHaveBeenCalledWith("col-1", "head-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:activities", "default");
  });

  it("joinLiveChain delegates to repo and revalidates", async () => {
    joinLiveChainRepo.mockResolvedValue({ chainRunId: "run-1" });
    const { joinLiveChain } = await import("./actions");
    await joinLiveChain("col-1", "sub-2");
    expect(joinLiveChainRepo).toHaveBeenCalledWith("col-1", "sub-2");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:activities", "default");
  });

  it("confirmChainStop parses answers and delegates to repo", async () => {
    confirmChainStopRepo.mockResolvedValue(undefined);
    const { confirmChainStop } = await import("./actions");
    await confirmChainStop("col-1", "run-1", [
      { documentId: "a", completed: true },
      { documentId: "b", completed: false },
    ]);
    expect(confirmChainStopRepo).toHaveBeenCalledWith("col-1", "run-1", [
      { documentId: "a", completed: true },
      { documentId: "b", completed: false },
    ]);
  });
});
