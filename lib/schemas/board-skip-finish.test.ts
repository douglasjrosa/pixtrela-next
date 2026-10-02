import { describe, expect, it } from "vitest";

import { skipFinishBoardSubtasksInputSchema } from "./board-skip-finish";

describe("skipFinishBoardSubtasksInputSchema", () => {
  it("requires at least one subtask id", () => {
    expect(() =>
      skipFinishBoardSubtasksInputSchema.parse({
        taskDocumentId: "task-1",
        subTaskDocumentIds: [],
      }),
    ).toThrow();
    expect(
      skipFinishBoardSubtasksInputSchema.parse({
        taskDocumentId: "task-1",
        subTaskDocumentIds: ["st-1"],
      }),
    ).toEqual({
      taskDocumentId: "task-1",
      subTaskDocumentIds: ["st-1"],
    });
  });
});
