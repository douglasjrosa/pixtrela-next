import { describe, expect, it } from "vitest";

import { rbxSubTaskPresetsResponseSchema } from "./rbx-sub-task-preset-contract";

describe("rbxSubTaskPresetsResponseSchema", () => {
  it("accepts the RBX read contract", () => {
    const parsed = rbxSubTaskPresetsResponseSchema.parse({
      presets: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Corte dos sarrafos",
          sharingType: "duration",
          actionName: "Cortar sarrafo amarrado",
          actionUnitTime: 1.66,
          maxSameTimeWorkers: 1,
        },
      ],
    });
    expect(parsed.presets).toHaveLength(1);
  });
});
