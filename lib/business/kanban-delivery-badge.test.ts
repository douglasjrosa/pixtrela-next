import { describe, expect, it } from "vitest";

import {
  kanbanDeliveryDateBadgeClassName,
  resolveKanbanDeliveryDateTone,
} from "./kanban-delivery-badge";

describe("resolveKanbanDeliveryDateTone", () => {
  const today = new Date(2026, 6, 7);

  it("returns danger for dates before today", () => {
    expect(resolveKanbanDeliveryDateTone("2026-07-06", today)).toBe("danger");
  });

  it("returns secondary for today and future dates", () => {
    expect(resolveKanbanDeliveryDateTone("2026-07-07", today)).toBe("secondary");
    expect(resolveKanbanDeliveryDateTone("2026-07-08", today)).toBe("secondary");
  });

  it("returns secondary when delivery date is missing or invalid", () => {
    expect(resolveKanbanDeliveryDateTone(null, today)).toBe("secondary");
    expect(resolveKanbanDeliveryDateTone("invalid", today)).toBe("secondary");
  });
});

describe("kanbanDeliveryDateBadgeClassName", () => {
  it("maps tones to badge classes", () => {
    expect(kanbanDeliveryDateBadgeClassName("danger")).toContain("destructive");
    expect(kanbanDeliveryDateBadgeClassName("secondary")).toContain("secondary");
  });
});
