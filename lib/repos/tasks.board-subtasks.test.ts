import { describe, expect, it } from "vitest";

import { mapBoardSubtaskSessionHistory } from "./tasks";

describe("mapBoardSubtaskSessionHistory", () => {
  it("groups activity rows into sessions per subtask", () => {
    const started = new Date("2026-07-16T10:00:00.000Z");
    const stopped = new Date("2026-07-16T10:01:00.000Z");

    const result = mapBoardSubtaskSessionHistory([
      {
        subTaskId: "sub-1",
        colaboratorId: "u-1",
        colaboratorName: "Ana",
        action: "started",
        timestamp: started,
        qty: 0,
      },
      {
        subTaskId: "sub-1",
        colaboratorId: "u-1",
        colaboratorName: "Ana",
        action: "stoped",
        timestamp: stopped,
        qty: 0,
      },
    ]);

    expect(result["sub-1"]).toHaveLength(1);
    expect(result["sub-1"]?.[0]?.durationSec).toBe(60);
    expect(result["sub-1"]?.[0]?.colaboratorDocumentId).toBe("u-1");
  });
});
