export function getNextSubTaskIndex(items: { index: number }[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.index)) + 1;
}

export function subTaskDisplayPosition(rowIndex: number): number {
  return rowIndex + 1;
}

export function buildSubTaskIndexUpdates(
  orderedDocumentIds: string[],
): { documentId: string; index: number }[] {
  return orderedDocumentIds.map((documentId, index) => ({
    documentId,
    index,
  }));
}

export function moveSubTaskInOrder<T extends { documentId: string }>(
  items: T[],
  activeId: string,
  overId: string,
): T[] | null {
  if (activeId === overId) return null;

  const fromIndex = items.findIndex((item) => item.documentId === activeId);
  const toIndex = items.findIndex((item) => item.documentId === overId);
  if (fromIndex === -1 || toIndex === -1) return null;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function applySequentialSubTaskIndices<T extends { index: number }>(
  items: T[],
): T[] {
  return items.map((item, index) => ({ ...item, index }));
}

export function reorderSubTasksByDrag<
  T extends { documentId: string; index: number },
>(items: T[], activeId: string, overId: string): T[] | null {
  const reordered = moveSubTaskInOrder(items, activeId, overId);
  if (!reordered) return null;
  return applySequentialSubTaskIndices(reordered);
}
