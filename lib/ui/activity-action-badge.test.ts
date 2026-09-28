import { describe, expect, it } from "vitest";

import { activityActionBadgeBackgroundClass } from "./activity-action-badge";

describe("activityActionBadgeBackgroundClass", () => {
  it("uses green for started and gray for stoped", () => {
    expect(activityActionBadgeBackgroundClass("started")).toBe("bg-green-600");
    expect(activityActionBadgeBackgroundClass("stoped")).toBe("bg-gray-600");
  });
});
