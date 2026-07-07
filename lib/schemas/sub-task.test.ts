import { describe, expect, it } from "vitest";

import { subTaskFormSchema } from "./sub-task";

describe("subTaskFormSchema", () => {
  it("accepts valid subtask", () => {
    const data = subTaskFormSchema.parse({
      name: "Soldar",
      qty: 1,
      expectedTime: 300,
      sharingType: "duration",
      maxSameTimeWorkers: 1,
      status: "waiting",
      activationStatus: "locked",
    });
    expect(data.name).toBe("Soldar");
    expect(data.activationStatus).toBe("locked");
  });

  it("defaults activationStatus to locked", () => {
    const data = subTaskFormSchema.parse({
      name: "Soldar",
      qty: 1,
      expectedTime: 300,
      sharingType: "duration",
      maxSameTimeWorkers: 1,
      status: "waiting",
    });
    expect(data.activationStatus).toBe("locked");
  });

  it("requires reasonForDisabling with min length when disabled", () => {
    const result = subTaskFormSchema.safeParse({
      name: "Soldar",
      qty: 1,
      expectedTime: 300,
      sharingType: "duration",
      maxSameTimeWorkers: 1,
      status: "waiting",
      activationStatus: "disabled",
      reasonForDisabling: "curta",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["reasonForDisabling"]);
  });

  it("accepts disabled subtask with valid reason", () => {
    const data = subTaskFormSchema.parse({
      name: "Soldar",
      qty: 1,
      expectedTime: 300,
      sharingType: "duration",
      maxSameTimeWorkers: 1,
      status: "waiting",
      activationStatus: "disabled",
      reasonForDisabling: "Equipamento indisponível para esta etapa.",
    });
    expect(data.activationStatus).toBe("disabled");
  });

  it("does not require reasonForDisabling when unlocked", () => {
    const data = subTaskFormSchema.parse({
      name: "Soldar",
      qty: 1,
      expectedTime: 300,
      sharingType: "duration",
      maxSameTimeWorkers: 1,
      status: "waiting",
      activationStatus: "unlocked",
    });
    expect(data.activationStatus).toBe("unlocked");
  });
});
