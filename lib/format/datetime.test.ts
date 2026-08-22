import { describe, expect, it } from "vitest";

import {
  elapsedSecondsSince,
  formatDatePtBr,
  formatDateTimePtBr,
  formatIsoDateToPtBrInput,
  formatMonthYearPtBr,
  formatTimePtBr,
  parsePtBrInputToIsoDate,
  splitDateTimePtBr,
} from "./datetime";

describe("formatMonthYearPtBr", () => {
  it("formats month and year with a Portuguese month name", () => {
    expect(formatMonthYearPtBr(8, 2026)).toBe("Agosto de 2026");
    expect(formatMonthYearPtBr(1, 2026)).toBe("Janeiro de 2026");
  });
});

describe("formatDatePtBr", () => {
  it("formats date-only values as dd/mm/yyyy", () => {
    expect(formatDatePtBr("2026-06-12")).toBe("12/06/2026");
  });

  it("formats ISO values for pt-BR date inputs", () => {
    expect(formatIsoDateToPtBrInput("2026-06-12")).toBe("12/06/2026");
    expect(parsePtBrInputToIsoDate("12/06/2026")).toBe("2026-06-12");
  });

  it("returns em dash for empty values", () => {
    expect(formatDatePtBr(null)).toBe("—");
    expect(formatDatePtBr("")).toBe("—");
  });
});

describe("formatDateTimePtBr", () => {
  it("formats iso datetimes in America/Sao_Paulo", () => {
    expect(formatDateTimePtBr("2026-06-05T10:00:00.000Z")).toBe(
      "05/06/2026, 07:00",
    );
  });
});

describe("formatTimePtBr", () => {
  it("formats iso datetimes as hh:mm in America/Sao_Paulo", () => {
    expect(formatTimePtBr("2026-06-05T10:00:00.000Z")).toBe("07:00");
  });
});

describe("splitDateTimePtBr", () => {
  it("returns date and time as separate labels in America/Sao_Paulo", () => {
    const parts = splitDateTimePtBr("2026-08-11T10:05:00.000Z");
    expect(parts).toEqual({ date: "11/08/2026", time: "07:05" });
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
