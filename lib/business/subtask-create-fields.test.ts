import { describe, expect, it } from "vitest";

import {
  normalizeSubTaskCreateValues,
  resolveSubTaskCreateActivationStatus,
} from "./subtask-create-fields";

describe("resolveSubTaskCreateActivationStatus", () => {
  const siblings = [
    { documentId: "st-1", status: "finished" as const },
    { documentId: "st-2", status: "waiting" as const },
  ];

  it("returns unlocked when there are no dependencies", () => {
    expect(resolveSubTaskCreateActivationStatus([], siblings)).toBe("unlocked");
  });

  it("returns unlocked when all dependencies are finished", () => {
    expect(
      resolveSubTaskCreateActivationStatus(["st-1"], siblings),
    ).toBe("unlocked");
  });

  it("returns locked when a dependency is not finished", () => {
    expect(
      resolveSubTaskCreateActivationStatus(["st-2"], siblings),
    ).toBe("locked");
  });
});

describe("normalizeSubTaskCreateValues", () => {
  it("forces waiting status and derives activation from dependencies", () => {
    const normalized = normalizeSubTaskCreateValues(
      {
        name: "Cortar",
        qty: 1,
        expectedTime: 60,
        sharingType: "duration",
        maxSameTimeWorkers: 2,
        status: "finished",
        activationStatus: "disabled",
        reasonForDisabling: "some reason",
        dependencyIds: ["st-2"],
        assignedToIds: [],
      },
      [{ documentId: "st-2", status: "waiting" }],
    );

    expect(normalized.status).toBe("waiting");
    expect(normalized.activationStatus).toBe("locked");
    expect(normalized.reasonForDisabling).toBe("");
  });
});
