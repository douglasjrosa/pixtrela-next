import { describe, expect, it } from "vitest";

import type { TeamRow } from "@/components/teams/types";

import {
  areAllSelectedTeamsArchived,
  areAllTeamsSelected,
  selectedTeamsFromList,
  toggleIdInSet,
  toggleSelectAllTeams,
} from "./team-list-selection";

const teams: TeamRow[] = [
  {
    documentId: "a",
    name: "A",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2026-01-01",
    untill: null,
    active: true,
    leader: null,
    colaborators: [],
  },
  {
    documentId: "b",
    name: "B",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2026-01-01",
    untill: null,
    active: false,
    leader: null,
    colaborators: [],
  },
];

describe("team-list-selection", () => {
  it("toggles ids in the selection set", () => {
    expect(toggleIdInSet(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleIdInSet(["a", "b"], "a")).toEqual(["b"]);
  });

  it("selects and clears all visible teams", () => {
    expect(areAllTeamsSelected(teams, ["a", "b"])).toBe(true);
    expect(toggleSelectAllTeams(teams, [])).toEqual(["a", "b"]);
    expect(toggleSelectAllTeams(teams, ["a", "b"])).toEqual([]);
  });

  it("detects when every selected team is archived", () => {
    expect(
      areAllSelectedTeamsArchived(selectedTeamsFromList(teams, ["b"])),
    ).toBe(true);
    expect(
      areAllSelectedTeamsArchived(selectedTeamsFromList(teams, ["a", "b"])),
    ).toBe(false);
  });
});
