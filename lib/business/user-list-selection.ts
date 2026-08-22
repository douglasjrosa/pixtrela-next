import type { UserRow } from "@/components/users/types";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllUsersSelected(
  users: readonly UserRow[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(users, selectedIds);
}

export function toggleSelectAllUsers(
  users: readonly UserRow[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(users, selectedIds);
}

export function selectedUsersFromList(
  users: readonly UserRow[],
  selectedIds: readonly string[],
): UserRow[] {
  return selectedRowsFromList(users, selectedIds);
}

export function areAllSelectedUsersDeactivated(
  selected: readonly UserRow[],
): boolean {
  return areAllSelectedRowsInactive(selected, (user) => Boolean(user.blocked));
}
