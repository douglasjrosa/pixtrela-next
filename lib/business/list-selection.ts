export type ListSelectableRow = {
  documentId: string;
};

export function toggleIdInSet(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((value) => value !== id);
  }
  return [...ids, id];
}

export function areAllRowsSelected<T extends ListSelectableRow>(
  rows: readonly T[],
  selectedIds: readonly string[],
): boolean {
  if (rows.length === 0) return false;
  return rows.every((row) => selectedIds.includes(row.documentId));
}

export function toggleSelectAllRows<T extends ListSelectableRow>(
  rows: readonly T[],
  selectedIds: readonly string[],
): string[] {
  if (areAllRowsSelected(rows, selectedIds)) {
    const visibleIds = new Set(rows.map((row) => row.documentId));
    return selectedIds.filter((id) => !visibleIds.has(id));
  }
  const merged = new Set(selectedIds);
  for (const row of rows) {
    merged.add(row.documentId);
  }
  return [...merged];
}

export function selectedRowsFromList<T extends ListSelectableRow>(
  rows: readonly T[],
  selectedIds: readonly string[],
): T[] {
  const idSet = new Set(selectedIds);
  return rows.filter((row) => idSet.has(row.documentId));
}

export function areAllSelectedRowsInactive<T>(
  selected: readonly T[],
  isInactive: (row: T) => boolean,
): boolean {
  if (selected.length === 0) return false;
  return selected.every(isInactive);
}
