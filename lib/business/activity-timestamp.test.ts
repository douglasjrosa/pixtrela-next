import { describe, expect, it } from "vitest";

import { formatActivityDateTimePtBr } from "@/lib/format/datetime";
import {
  formatActivitySubtaskLabel,
  formatColaboratorLabel,
  zonedDateTimeToUtc,
} from "@/lib/business/activity-timestamp";

describe("activity display format", () => {
  it("formats datetime as 15h32 - 21/09/2026", () => {
    const value = zonedDateTimeToUtc("2026-09-21", "15:32");
    expect(value).not.toBeNull();
    expect(formatActivityDateTimePtBr(value)).toBe("15h32 - 21/09/2026");
  });

  it("formats colaborator and subtask labels", () => {
    expect(formatColaboratorLabel("Márcio", 5432)).toBe("Márcio 5432");
    expect(formatColaboratorLabel("Márcio", null)).toBe("Márcio");
    expect(
      formatActivitySubtaskLabel(
        "Montagem dos quadros das laterais",
        "Medpej - MC100",
      ),
    ).toBe("Montagem dos quadros das laterais - Medpej - MC100");
  });
});
