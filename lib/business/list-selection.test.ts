import { describe, expect, it } from "vitest";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleIdInSet,
  toggleSelectAllRows,
} from "./list-selection";

const rows = [
  { documentId: "a", active: true },
  { documentId: "b", active: false },
];

describe("list-selection", () => {
  it("toggles ids in the selection set", () => {
    expect(toggleIdInSet(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIdInSet(["a", "b"], "a")).toEqual(["b"]);
  });

  it("selects and clears all visible rows", () => {
    expect(areAllRowsSelected(rows, ["a", "b"])).toBe(true);
    expect(toggleSelectAllRows(rows, [])).toEqual(["a", "b"]);
    expect(toggleSelectAllRows(rows, ["a", "b"])).toEqual([]);
  });

  it("detects when every selected row is inactive", () => {
    const selectedInactive = selectedRowsFromList(rows, ["b"]);
    expect(
      areAllSelectedRowsInactive(selectedInactive, (row) => !row.active),
    ).toBe(true);
    const selectedMixed = selectedRowsFromList(rows, ["a", "b"]);
    expect(
      areAllSelectedRowsInactive(selectedMixed, (row) => !row.active),
    ).toBe(false);
  });
});
