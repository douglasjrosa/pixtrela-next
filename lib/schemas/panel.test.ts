import { describe, expect, it } from "vitest";

import { panelFormSchema } from "./panel";

const VALID = {
  name: "Montagem",
  slug: "montagem",
  stepId: "11111111-1111-4111-8111-111111111111",
  teamIds: ["22222222-2222-4222-8222-222222222222"],
};

describe("panelFormSchema", () => {
  it("accepts a named panel with step and teams", () => {
    expect(panelFormSchema.parse(VALID)).toEqual(VALID);
  });

  it("rejects an empty name", () => {
    expect(() => panelFormSchema.parse({ ...VALID, name: "  " })).toThrow();
  });

  it("rejects a malformed slug", () => {
    expect(() =>
      panelFormSchema.parse({ ...VALID, slug: "Montagem" }),
    ).toThrow();
  });

  it("requires at least one team", () => {
    expect(() => panelFormSchema.parse({ ...VALID, teamIds: [] })).toThrow();
  });
});
