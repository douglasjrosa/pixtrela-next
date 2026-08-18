import { describe, expect, it } from "vitest";

import { activityFormSchema } from "./activity";

describe("activityFormSchema", () => {
  it("accepts start activity", () => {
    expect(
      activityFormSchema.parse({
        subTaskDocumentId: "abc",
        action: "started",
      }),
    ).toMatchObject({ action: "started" });
  });

  it("accepts stop activity with zero qty", () => {
    expect(
      activityFormSchema.parse({
        subTaskDocumentId: "abc",
        action: "stoped",
        qty: 0,
      }),
    ).toMatchObject({ qty: 0 });
  });
});
