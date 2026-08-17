import { describe, expect, it } from "vitest";

import {
  isDefaultTemplateListSort,
  nextTemplateListSort,
} from "./template-list-sort";

describe("nextTemplateListSort", () => {
  it("starts at asc when switching columns", () => {
    expect(
      nextTemplateListSort({ column: "name", direction: "asc" }, "code"),
    ).toEqual({ column: "code", direction: "asc" });
  });

  it("toggles direction on the same column", () => {
    expect(
      nextTemplateListSort({ column: "code", direction: "asc" }, "code"),
    ).toEqual({ column: "code", direction: "desc" });
  });
});

describe("isDefaultTemplateListSort", () => {
  it("is true only for name asc", () => {
    expect(
      isDefaultTemplateListSort({ column: "name", direction: "asc" }),
    ).toBe(true);
    expect(
      isDefaultTemplateListSort({ column: "name", direction: "desc" }),
    ).toBe(false);
  });
});
