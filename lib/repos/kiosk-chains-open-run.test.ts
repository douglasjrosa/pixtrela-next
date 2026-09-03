import { describe, expect, it } from "vitest";

import {
  resolveOpenChainRunFromActivityRows,
  resolveOpenPrincipalForChainMembers,
} from "./kiosk-chains";

describe("resolveOpenChainRunFromActivityRows", () => {
  it("returns the open principal run", () => {
    const startedAt = new Date("2026-08-17T10:00:00.000Z");
    const open = resolveOpenChainRunFromActivityRows([
      {
        chainRunId: "run-1",
        colaboratorId: "u-1",
        action: "started",
        timestamp: startedAt,
        subTaskId: "st-1",
      },
    ]);
    expect(open).toEqual({
      chainRunId: "run-1",
      principalId: "u-1",
      runStartedAt: startedAt,
    });
  });

  it("ignores a closed run", () => {
    const open = resolveOpenChainRunFromActivityRows([
      {
        chainRunId: "run-1",
        colaboratorId: "u-1",
        action: "started",
        timestamp: new Date("2026-08-17T10:00:00.000Z"),
        subTaskId: "st-1",
      },
      {
        chainRunId: "run-1",
        colaboratorId: "u-1",
        action: "stoped",
        timestamp: new Date("2026-08-17T10:05:00.000Z"),
        subTaskId: "st-1",
      },
    ]);
    expect(open).toBeNull();
  });
});

describe("resolveOpenPrincipalForChainMembers", () => {
  it("ignores started rows outside the chain member set", () => {
    const rows = [
      {
        id: "a1",
        subTaskId: "outside",
        colaboratorId: "helper",
        action: "started",
        timestamp: new Date("2026-08-17T09:00:00.000Z"),
        qty: 0,
        currencyAwarded: 0,
        chainRunId: "run-1",
      },
      {
        id: "a2",
        subTaskId: "st-1",
        colaboratorId: "principal",
        action: "started",
        timestamp: new Date("2026-08-17T10:00:00.000Z"),
        qty: 0,
        currencyAwarded: 0,
        chainRunId: "run-1",
      },
    ];

    expect(
      resolveOpenPrincipalForChainMembers(rows, new Set(["st-1", "st-2"])),
    ).toBe("principal");
  });
});