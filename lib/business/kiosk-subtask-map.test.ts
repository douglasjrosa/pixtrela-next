import { describe, expect, it } from "vitest";

import { buildViewerStopStatsBySubTaskId } from "./kiosk-subtask-map";

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
