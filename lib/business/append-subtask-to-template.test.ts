import { describe, expect, it } from "vitest";

import {
  appendSubtaskToTemplateComponents,
  mapDependencyIdsToTemplateIndexes,
} from "./append-subtask-to-template";

describe("mapDependencyIdsToTemplateIndexes", () => {
  it("maps task dependency document ids to template indexes by name", () => {
    expect(
      mapDependencyIdsToTemplateIndexes(
        ["st-2", "st-1", "missing"],
        [
          { documentId: "st-1", name: "Corte" },
          { documentId: "st-2", name: "Solda" },
        ],
        ["Prep", "Corte", "Solda"],
      ),
    ).toEqual([1, 2]);
  });
});

describe("appendSubtaskToTemplateComponents", () => {
  it("appends a new template subtask at the end", () => {
    expect(
      appendSubtaskToTemplateComponents(
        [
          {
            name: "Corte",
            qty: 1,
            expectedTime: 10,
            sharingType: "duration",
            maxSameTimeWorkers: 1,
            index: 0,
            dependencies: null,
          },
        ],
        {
          name: "Solda",
          qty: 2,
          expectedTime: 30,
          sharingType: "qty",
          maxSameTimeWorkers: 2,
        },
        [0],
      ),
    ).toEqual([
      {
        name: "Corte",
        qty: 1,
        expectedTime: 10,
        sharingType: "duration",
        maxSameTimeWorkers: 1,
        index: 0,
        dependencies: null,
      },
      {
        name: "Solda",
        qty: 2,
        expectedTime: 30,
        sharingType: "qty",
        maxSameTimeWorkers: 2,
        index: 1,
        dependencies: [0],
      },
    ]);
  });
});
