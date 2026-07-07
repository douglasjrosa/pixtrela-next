import { describe, expect, it } from "vitest";

import { resolveDefaultColaboratorDocumentId } from "./resolve-default-colaborator";

const OPTIONS = [
  { documentId: "c1", name: "Ana", code: 1 },
  { documentId: "c2", name: "Bia", code: 2 },
];

describe("resolveDefaultColaboratorDocumentId", () => {
  it("returns session user for colaborator", () => {
    expect(
      resolveDefaultColaboratorDocumentId({
        role: "colaborator",
        sessionUserId: "c1",
        searchParam: "c2",
        options: OPTIONS,
      }),
    ).toBe("c1");
  });

  it("prefers search param when valid for staff", () => {
    expect(
      resolveDefaultColaboratorDocumentId({
        role: "leader",
        sessionUserId: "l1",
        searchParam: "c2",
        options: OPTIONS,
      }),
    ).toBe("c2");
  });

  it("falls back to the first option for staff", () => {
    expect(
      resolveDefaultColaboratorDocumentId({
        role: "manager",
        sessionUserId: "m1",
        searchParam: undefined,
        options: OPTIONS,
      }),
    ).toBe("c1");
  });
});
