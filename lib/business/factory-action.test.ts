import { describe, expect, it } from "vitest";

import {
  parseActionUnitTime,
  shouldSearchFactoryActions,
} from "./factory-action";

describe("shouldSearchFactoryActions", () => {
  it("requires at least 3 characters after trim", () => {
    expect(shouldSearchFactoryActions("ab")).toBe(false);
    expect(shouldSearchFactoryActions("abc")).toBe(true);
  });
});

describe("parseActionUnitTime", () => {
  it("parses numeric strings", () => {
    expect(parseActionUnitTime("1.04")).toBe(1.04);
    expect(parseActionUnitTime(2)).toBe(2);
    expect(parseActionUnitTime("nope")).toBe(0);
  });
});
