import { describe, expect, it } from "vitest";

import {
  elapsedSecondsSince,
  formatDatePtBr,
  formatDateTimePtBr,
  formatTimePtBr,
  splitDateTimePtBr,
} from "./datetime";

describe("formatDatePtBr", () => {
  it("formats date-only values as dd/mm/yyyy", () => {
    expect(formatDatePtBr("2026-06-12")).toBe("12/06/2026");
  });

  it("returns em dash for empty values", () => {
    expect(formatDatePtBr(null)).toBe("—");
    expect(formatDatePtBr("")).toBe("—");
  });
});

describe("formatDateTimePtBr", () => {
  it("formats iso datetimes with date and time", () => {
    const formatted = formatDateTimePtBr("2026-06-05T10:00:00.000Z");
    expect(formatted).toMatch(/05\/06\/2026/);
  });
});

describe("formatTimePtBr", () => {
  it("formats iso datetimes as hh:mm", () => {
    const formatted = formatTimePtBr("2026-06-05T10:00:00.000Z");
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });
});

describe("splitDateTimePtBr", () => {
  it("returns date and time as separate labels", () => {
    const parts = splitDateTimePtBr("2026-07-15T22:28:00.000Z");
    expect(parts.date).toMatch(/\d{2}\/\d{2}\/2026/);
    expect(parts.time).toMatch(/\d{2}:\d{2}/);
    expect(parts.date).not.toContain(",");
    expect(parts.time).not.toContain(",");
  });

  it("returns em dash date for empty values", () => {
    expect(splitDateTimePtBr(null)).toEqual({ date: "—", time: "" });
  });
});

describe("elapsedSecondsSince", () => {
  it("returns seconds between iso date and now", () => {
    const startedAt = "2026-06-05T10:00:00.000Z";
    const nowMs = new Date("2026-06-05T10:00:45.000Z").getTime();
    expect(elapsedSecondsSince(startedAt, nowMs)).toBe(45);
  });
});
