import { describe, expect, it } from "vitest";

import {
  activitySubtaskMatchesQuery,
  formatActivitySubtaskDisplayLabel,
  formatActivitySubtaskQueueBadges,
} from "./activity-subtask-label";

const SAMPLE: Parameters<typeof formatActivitySubtaskDisplayLabel>[0] = {
  subTaskName: "Corte das tábuas",
  taskQty: 10,
  taskName: "Max Brasil - Test Box",
  taskCrmItemKey: "1969:2",
  taskDeliveryDate: "2026-09-21",
};

describe("formatActivitySubtaskDisplayLabel", () => {
  it("joins subtask, qty, task, pedido-item and delivery", () => {
    expect(formatActivitySubtaskDisplayLabel(SAMPLE)).toBe(
      "Corte das tábuas - 10 - Max Brasil - Test Box - 1969-2 - 21/09/2026",
    );
  });

  it("uses em dash placeholders when pedido or delivery are missing", () => {
    expect(
      formatActivitySubtaskDisplayLabel({
        subTaskName: "Montagem",
        taskQty: 1,
        taskName: "Solo",
        taskCrmItemKey: null,
        taskDeliveryDate: null,
      }),
    ).toBe("Montagem - 1 - Solo - — - —");
  });
});

describe("formatActivitySubtaskQueueBadges", () => {
  it("splits queue row activity into primary, secondary, and tertiary badges", () => {
    expect(formatActivitySubtaskQueueBadges(SAMPLE)).toEqual({
      primary: "10 - Max Brasil - Test Box",
      secondary: "Corte das tábuas",
      tertiary: "1969-2 - 21/09/2026",
    });
  });
});

describe("activitySubtaskMatchesQuery", () => {
  it("matches any segment including task name with hyphens", () => {
    expect(activitySubtaskMatchesQuery(SAMPLE, "test box")).toBe(true);
    expect(activitySubtaskMatchesQuery(SAMPLE, "1969-2")).toBe(true);
    expect(activitySubtaskMatchesQuery(SAMPLE, "21/09")).toBe(true);
    expect(activitySubtaskMatchesQuery(SAMPLE, "corte")).toBe(true);
    expect(activitySubtaskMatchesQuery(SAMPLE, "nope")).toBe(false);
  });
});
