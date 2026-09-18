import { describe, expect, it } from "vitest";

import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";

import {
  reconcileLoadedSubtaskLinks,
  resolveDraftLinkedToPrevious,
  shouldFlushBoardLink,
} from "./board-link-queue";

describe("shouldFlushBoardLink", () => {
  it("skips while a request is in flight", () => {
    expect(shouldFlushBoardLink(true, true, false)).toBe(false);
  });

  it("skips when there is no desired value", () => {
    expect(shouldFlushBoardLink(undefined, false, false)).toBe(false);
  });

  it("skips when desired already matches the last ack", () => {
    expect(shouldFlushBoardLink(true, false, true)).toBe(false);
  });

  it("flushes when desired differs from the last ack", () => {
    expect(shouldFlushBoardLink(true, false, false)).toBe(true);
    expect(shouldFlushBoardLink(false, false, undefined)).toBe(true);
  });
});

describe("resolveDraftLinkedToPrevious", () => {
  it("prefers pending desired link over loaded value", () => {
    expect(
      resolveDraftLinkedToPrevious(
        false,
        "st-2",
        boardSubTaskSummaryStub({
          documentId: "st-2",
          name: "Cortar",
          linkedToPrevious: true,
        }),
        {
          pendingLinks: new Map([["st-2", true]]),
          inFlightLinkIds: new Set(),
        },
      ),
    ).toBe(true);
  });
});

describe("reconcileLoadedSubtaskLinks", () => {
  it("keeps acked link when loaded list is stale", () => {
    const loaded = [
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        linkedToPrevious: false,
      }),
    ];
    expect(
      reconcileLoadedSubtaskLinks(loaded, new Map([["st-2", true]])),
    ).toEqual([
      {
        ...loaded[0],
        linkedToPrevious: true,
      },
    ]);
  });
});
