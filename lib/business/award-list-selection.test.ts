import { describe, expect, it } from "vitest";

import type { AwardRow } from "@/components/awards/types";

import {
  areAllAwardsSelected,
  areAllSelectedAwardsArchived,
  selectedAwardsFromList,
  toggleIdInSet,
  toggleSelectAllAwards,
} from "./award-list-selection";

const awards: AwardRow[] = [
  {
    documentId: "a",
    name: "A",
    active: true,
    showInStore: true,
    stock: 0,
    actualPrice: 0,
    autoRecalculate: true,
    values: [{ numberOf: 10, currencyDocumentId: "c1" }],
  },
  {
    documentId: "b",
    name: "B",
    active: false,
    showInStore: true,
    stock: 0,
    actualPrice: 0,
    autoRecalculate: true,
    values: [{ numberOf: 20, currencyDocumentId: "c1" }],
  },
];

describe("award-list-selection", () => {
  it("toggles ids in the selection set", () => {
    expect(toggleIdInSet(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIdInSet(["a", "b"], "a")).toEqual(["b"]);
  });

  it("selects and clears all visible awards", () => {
    expect(areAllAwardsSelected(awards, ["a", "b"])).toBe(true);
    expect(toggleSelectAllAwards(awards, [])).toEqual(["a", "b"]);
    expect(toggleSelectAllAwards(awards, ["a", "b"])).toEqual([]);
  });

  it("detects when every selected award is archived", () => {
    expect(
      areAllSelectedAwardsArchived(selectedAwardsFromList(awards, ["b"])),
    ).toBe(true);
    expect(
      areAllSelectedAwardsArchived(selectedAwardsFromList(awards, ["a", "b"])),
    ).toBe(false);
  });
});
