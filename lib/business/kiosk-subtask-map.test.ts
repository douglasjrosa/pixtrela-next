import { describe, expect, it } from "vitest";

import {
  buildViewerStopStatsBySubTaskId,
  mapSubTaskDbRow,
} from "./kiosk-subtask-map";

describe("mapSubTaskDbRow", () => {
  it("uses stored qty as targetQty without multiplying by task qty", () => {
    const mapped = mapSubTaskDbRow({
      id: "s1",
      name: "Cut",
      index: 0,
      status: "waiting",
      activationStatus: "unlocked",
      qty: 20,
      sharingType: "qty",
      timeSpent: 0,
      expectedTime: 620,
      taskId: "t1",
      taskName: "Task",
      taskIndex: 0,
      taskQty: 10,
      maxSameTimeWorkers: 1,
      linkedToPrevious: false,
    });
    expect(mapped.targetQty).toBe(20);
    expect(mapped.qty).toBe(20);
  });
});

describe("buildViewerStopStatsBySubTaskId", () => {
  it("marks participation and sums currency from viewer stops", () => {
    const stats = buildViewerStopStatsBySubTaskId([
      { subTaskId: "a", action: "started", currencyAwarded: 0 },
      { subTaskId: "a", action: "stoped", currencyAwarded: 4 },
      { subTaskId: "a", action: "stoped", currencyAwarded: 6 },
      { subTaskId: "b", action: "started", currencyAwarded: 0 },
    ]);

    expect(stats.participatedIds.has("a")).toBe(true);
    expect(stats.participatedIds.has("b")).toBe(false);
    expect(stats.currencyBySubTaskId.get("a")).toBe(10);
    expect(stats.currencyBySubTaskId.get("b")).toBeUndefined();
  });

  it("treats a zero-credit stop as participation", () => {
    const stats = buildViewerStopStatsBySubTaskId([
      { subTaskId: "a", action: "stoped", currencyAwarded: 0 },
    ]);

    expect(stats.participatedIds.has("a")).toBe(true);
    expect(stats.currencyBySubTaskId.get("a")).toBe(0);
  });
});
