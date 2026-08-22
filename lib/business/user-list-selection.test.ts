import { describe, expect, it } from "vitest";

import type { UserRow } from "@/components/users/types";

import {
  areAllSelectedUsersDeactivated,
  areAllUsersSelected,
  selectedUsersFromList,
  toggleSelectAllUsers,
} from "./user-list-selection";

const users: UserRow[] = [
  {
    id: "a",
    documentId: "a",
    name: "Active",
    username: "active.1",
    code: 1,
    roleType: "colaborator",
    blocked: false,
  },
  {
    id: "b",
    documentId: "b",
    name: "Blocked",
    username: "blocked.2",
    code: 2,
    roleType: "colaborator",
    blocked: true,
  },
];

describe("user-list-selection", () => {
  it("selects and clears all visible users", () => {
    expect(areAllUsersSelected(users, ["a", "b"])).toBe(true);
    expect(toggleSelectAllUsers(users, [])).toEqual(["a", "b"]);
    expect(toggleSelectAllUsers(users, ["a", "b"])).toEqual([]);
  });

  it("detects when every selected user is deactivated", () => {
    expect(
      areAllSelectedUsersDeactivated(selectedUsersFromList(users, ["b"])),
    ).toBe(true);
    expect(
      areAllSelectedUsersDeactivated(selectedUsersFromList(users, ["a", "b"])),
    ).toBe(false);
  });
});
