import { describe, expect, it } from "vitest";

import { mergeStaffSelfIntoCredentialList } from "./staff-credential-list";

describe("mergeStaffSelfIntoCredentialList", () => {
  const ana = { documentId: "c1", name: "Ana" };
  const lead = { documentId: "lead-1", name: "Lia" };

  it("appends the staff member last", () => {
    expect(mergeStaffSelfIntoCredentialList([ana], lead)).toEqual([
      ana,
      lead,
    ]);
  });

  it("moves staff to the end when they were already listed", () => {
    expect(mergeStaffSelfIntoCredentialList([lead, ana], lead)).toEqual([
      ana,
      lead,
    ]);
  });

  it("returns colaborators when staff is missing", () => {
    expect(mergeStaffSelfIntoCredentialList([ana], null)).toEqual([ana]);
  });
});
