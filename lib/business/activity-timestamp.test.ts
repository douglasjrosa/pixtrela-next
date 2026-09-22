import { describe, expect, it } from "vitest";

import { formatActivityDateTimePtBr } from "@/lib/format/datetime";
import {
  formatColaboratorLabel,
  zonedDateTimeToUtc,
} from "@/lib/business/activity-timestamp";

describe("activity display format", () => {
  it("formats datetime as 21/09/2026 - 15h32", () => {
    const value = zonedDateTimeToUtc("2026-09-21", "15:32");
    expect(value).not.toBeNull();
    expect(formatActivityDateTimePtBr(value)).toBe("21/09/2026 - 15h32");
  });

  it("formats colaborator labels", () => {
    expect(formatColaboratorLabel("Márcio", 5432)).toBe("Márcio 5432");
    expect(formatColaboratorLabel("Márcio", null)).toBe("Márcio");
  });
});
