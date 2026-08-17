import { describe, expect, it } from "vitest";

import type { KioskSubTask } from "@/lib/business/subtask-queue";
import { buildKioskQueueFingerprint } from "./queue-fingerprint";

function subTask(
  overrides: Partial<KioskSubTask> & Pick<KioskSubTask, "documentId">,
): KioskSubTask {
  return {
    documentId: overrides.documentId,
    name: overrides.name ?? "Task",
    index: overrides.index ?? 0,
    status: overrides.status ?? "waiting",
    activationStatus: overrides.activationStatus ?? "unlocked",
    qty: overrides.qty ?? 1,
    targetQty: overrides.targetQty ?? 1,
    completedQty: overrides.completedQty ?? 0,
    sharingType: overrides.sharingType ?? "duration",
    timeSpent: overrides.timeSpent ?? 0,
    startedAt: overrides.startedAt ?? null,
    expectedTime: overrides.expectedTime ?? 0,
    taskDocumentId: overrides.taskDocumentId ?? "task-1",
    taskName: overrides.taskName ?? "Parent",
    taskIndex: overrides.taskIndex ?? 0,
    finishedAt: overrides.finishedAt ?? null,
    activeWorkerCount: overrides.activeWorkerCount ?? 0,
  };
}

describe("buildKioskQueueFingerprint", () => {
  it("changes when subtask status changes", () => {
    const before = buildKioskQueueFingerprint([
      subTask({ documentId: "a", status: "producing", startedAt: "2026-01-01T10:00:00.000Z" }),
    ]);
    const after = buildKioskQueueFingerprint([
      subTask({ documentId: "a", status: "waiting", startedAt: null }),
    ]);
    expect(after).not.toBe(before);
  });
});
