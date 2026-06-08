import { describe, expect, it } from "vitest";

import {
  ceilSecondsToMinutes,
  formatDurationMinutes,
  type DurationTranslator,
} from "./duration";

const t: DurationTranslator = (key, values) => {
  if (key === "hoursMinutes") {
    return `${values.hours}h ${values.minutes}min`;
  }
  if (key === "hoursOnly") {
    return `${values.hours}h`;
  }
  return `${values.minutes}min`;
};

describe("ceilSecondsToMinutes", () => {
  it("rounds up partial minutes", () => {
    expect(ceilSecondsToMinutes(1)).toBe(1);
    expect(ceilSecondsToMinutes(60)).toBe(1);
    expect(ceilSecondsToMinutes(61)).toBe(2);
  });
});

describe("formatDurationMinutes", () => {
  it("formats hours and minutes", () => {
    expect(formatDurationMinutes(5400, t)).toBe("1h 30min");
  });

  it("formats hours only", () => {
    expect(formatDurationMinutes(3600, t)).toBe("1h");
  });

  it("formats minutes only", () => {
    expect(formatDurationMinutes(125, t)).toBe("3min");
  });

  it("formats zero as 0min", () => {
    expect(formatDurationMinutes(0, t)).toBe("0min");
  });
});
