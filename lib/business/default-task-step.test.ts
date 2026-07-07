import { describe, expect, it } from "vitest";

import {
  buildCreateTaskFormDefaults,
  resolveDefaultStepDocumentId,
} from "./default-task-step";

describe("resolveDefaultStepDocumentId", () => {
  it("prefers a step whose name matches the queue pattern", () => {
    const steps = [
      { documentId: "s2", name: "Produzindo" },
      { documentId: "s1", name: "Na Fila" },
    ];

    expect(resolveDefaultStepDocumentId(steps)).toBe("s1");
  });

  it("falls back to the first step when no queue name matches", () => {
    const steps = [
      { documentId: "s1", name: "Produzindo" },
      { documentId: "s2", name: "Finalizado" },
    ];

    expect(resolveDefaultStepDocumentId(steps)).toBe("s1");
  });

  it("returns empty string when there are no steps", () => {
    expect(resolveDefaultStepDocumentId([])).toBe("");
  });
});

describe("buildCreateTaskFormDefaults", () => {
  it("defaults stepDocumentId to the queue step", () => {
    const defaults = buildCreateTaskFormDefaults([
      { documentId: "s1", name: "Na Fila" },
      { documentId: "s2", name: "Produzindo" },
    ]);

    expect(defaults.stepDocumentId).toBe("s1");
    expect(defaults.status).toBe("waiting");
  });
});
