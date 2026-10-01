import { after } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { scheduleTaskSubTaskSync } from "@/lib/repos/schedule-task-sync";

const runTaskSubTaskSyncRoutine = vi.fn();

vi.mock("next/server", () => ({
  after: vi.fn(),
}));

vi.mock("@/lib/repos/subtask-lifecycle", () => ({
  runTaskSubTaskSyncRoutine: (...args: unknown[]) =>
    runTaskSubTaskSyncRoutine(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({ kind: "db" }),
}));

describe("scheduleTaskSubTaskSync", () => {
  const now = new Date("2026-09-29T18:00:00.000Z");

  beforeEach(() => {
    runTaskSubTaskSyncRoutine.mockReset();
    vi.mocked(after).mockReset();
  });

  it("returns before the history sync when after() accepts the work", async () => {
    let started = false;
    runTaskSubTaskSyncRoutine.mockImplementation(async () => {
      started = true;
    });
    vi.mocked(after).mockImplementation(() => undefined);

    await scheduleTaskSubTaskSync("task-1", now);

    expect(started).toBe(false);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("runs the history sync before returning outside a request", async () => {
    vi.mocked(after).mockImplementation(() => {
      throw new Error("outside request");
    });
    let finished = false;
    runTaskSubTaskSyncRoutine.mockImplementation(async () => {
      finished = true;
    });

    await scheduleTaskSubTaskSync("task-1", now);

    expect(finished).toBe(true);
    expect(runTaskSubTaskSyncRoutine).toHaveBeenCalledWith(
      "task-1",
      { kind: "db" },
      now,
    );
  });
});
