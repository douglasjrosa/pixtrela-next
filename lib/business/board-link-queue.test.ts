import { describe, expect, it } from "vitest";

import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";

import {
  buildLinksSnapshot,
  collectDirtyLinkUpdates,
  hasLinkDraftChanges,
  mergeLinksBaseline,
} from "./board-link-queue";

describe("buildLinksSnapshot", () => {
  it("maps document ids to linkedToPrevious", () => {
    expect(
      buildLinksSnapshot([
        boardSubTaskSummaryStub({
          documentId: "st-1",
          name: "Soldar",
          linkedToPrevious: false,
        }),
        boardSubTaskSummaryStub({
          documentId: "st-2",
          name: "Cortar",
          linkedToPrevious: true,
        }),
      ]),
    ).toEqual({
      "st-1": false,
      "st-2": true,
    });
  });
});

describe("collectDirtyLinkUpdates", () => {
  it("returns pending subtasks whose link flag differs from baseline", () => {
    const subtasks = [
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        linkedToPrevious: true,
      }),
    ];
    expect(
      collectDirtyLinkUpdates(subtasks, { "st-2": false }),
    ).toEqual([{ documentId: "st-2", linkedToPrevious: true }]);
  });

  it("ignores finished subtasks", () => {
    const subtasks = [
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "finished",
        linkedToPrevious: true,
      }),
    ];
    expect(collectDirtyLinkUpdates(subtasks, { "st-2": false })).toEqual([]);
  });
});

describe("hasLinkDraftChanges", () => {
  it("is true when any pending link differs from baseline", () => {
    expect(
      hasLinkDraftChanges(
        [
          boardSubTaskSummaryStub({
            documentId: "st-2",
            name: "Cortar",
            status: "waiting",
            linkedToPrevious: true,
          }),
        ],
        { "st-2": false },
      ),
    ).toBe(true);
  });
});

describe("mergeLinksBaseline", () => {
  it("keeps baseline keys for loaded subtasks and adds new ones", () => {
    expect(
      mergeLinksBaseline(
        { "st-1": false, "st-gone": true },
        [
          boardSubTaskSummaryStub({
            documentId: "st-1",
            name: "Soldar",
            linkedToPrevious: true,
          }),
          boardSubTaskSummaryStub({
            documentId: "st-3",
            name: "Nova",
            linkedToPrevious: false,
          }),
        ],
      ),
    ).toEqual({
      "st-1": false,
      "st-3": false,
    });
  });
});
