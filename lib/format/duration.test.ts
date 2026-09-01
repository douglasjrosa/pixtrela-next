import { describe, expect, it } from "vitest";

import {
  ceilSecondsToMinutes,
  formatDurationHms,
  formatDurationMinutes,
  type DurationTranslator,
  type HmsDurationTranslator,
} from "./duration";

const t: DurationTranslator = (key, values) => {
  if (key === "hoursMinutes") {
    return `${values.hours}h ${values.minutes}m`;
  }
  if (key === "hoursOnly") {
    return `${values.hours}h`;
  }
  return `${values.minutes}m`;
};

const tHms: HmsDurationTranslator = (key, values) => {
  if (key === "hoursMinutesSeconds") {
    return `${values.hours}h ${values.minutes}m ${values.seconds}s`;
  }
  if (key === "minutesSeconds") {
    return `${values.minutes}m ${values.seconds}s`;
  }
  return `${values.seconds}s`;
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
    expect(formatDurationMinutes(5400, t)).toBe("1h 30m");
  });

  it("formats hours only", () => {
    expect(formatDurationMinutes(3600, t)).toBe("1h");
  });

  it("formats minutes only", () => {
    expect(formatDurationMinutes(125, t)).toBe("3m");
  });

  it("formats zero as 0m", () => {
    expect(formatDurationMinutes(0, t)).toBe("0m");
  });
});

describe("formatDurationHms", () => {
  it("formats minutes and seconds", () => {
    expect(formatDurationHms(323, tHms)).toBe("5m 23s");
  });

  it("formats hours, minutes and seconds", () => {
    expect(formatDurationHms(3725, tHms)).toBe("1h 2m 5s");
  });

  it("formats seconds only", () => {
    expect(formatDurationHms(7, tHms)).toBe("7s");
  });
});
