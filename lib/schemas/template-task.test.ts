import { describe, expect, it } from "vitest";

import { templateTaskFormSchema } from "./template-task";

describe("templateTaskFormSchema", () => {
  it("accepts template with embedded subTask components", () => {
    expect(
      templateTaskFormSchema.parse({
        name: "Montagem",
        code: "MNT-01",
        subTask: [
          {
            name: "Soldar",
            qty: 1,
            sharingType: "duration",
            maxSameTimeWorkers: 2,
            index: 0,
            expectedTime: 120,
          },
        ],
      }),
    ).toMatchObject({ code: "MNT-01" });
  });

  it("accepts template without subtasks", () => {
    expect(templateTaskFormSchema.parse({ name: "Montagem", code: "MNT-01" })).toEqual(
      {
        name: "Montagem",
        code: "MNT-01",
      },
    );
  });
});
