import { describe, expect, it } from "vitest";

import {
  liveStateFromOpenActivityRows,
  mergeBoardSubtaskLiveState,
} from "./board-subtask-live";
import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";

describe("mergeBoardSubtaskLiveState", () => {
  it("overlays producing fields without touching assignees", () => {
    const current = [
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "producing",
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
    ];

    const merged = mergeBoardSubtaskLiveState(current, {
      "st-1": {
        producingColaboratorIds: ["u-1"],
        openActivityStartedAts: ["2026-07-16T11:00:00.000Z"],
      },
    });

    expect(merged[0]?.assignedTo).toEqual([{ documentId: "u-1", name: "Ana" }]);
    expect(merged[0]?.producingColaboratorIds).toEqual(["u-1"]);
    expect(merged[0]?.openActivityStartedAts).toEqual([
      "2026-07-16T11:00:00.000Z",
    ]);
  });

  it("clears live fields when the map has no entry", () => {
    const current = [
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        producingColaboratorIds: ["u-1"],
        openActivityStartedAts: ["2026-07-16T11:00:00.000Z"],
      }),
    ];

    const merged = mergeBoardSubtaskLiveState(current, {});
    expect(merged[0]?.producingColaboratorIds).toEqual([]);
    expect(merged[0]?.openActivityStartedAts).toEqual([]);
  });
});

describe("liveStateFromOpenActivityRows", () => {
  it("groups open started rows by subtask", () => {
    const live = liveStateFromOpenActivityRows([
      {
        subTaskId: "st-1",
        colaboratorId: "u-1",
        colaboratorName: "Ana",
        action: "started",
        timestamp: new Date("2026-07-16T11:00:00.000Z"),
        qty: 0,
      },
    ]);

    expect(live["st-1"]?.producingColaboratorIds).toEqual(["u-1"]);
    expect(live["st-1"]?.openActivityStartedAts).toEqual([
      "2026-07-16T11:00:00.000Z",
    ]);
  });
});
