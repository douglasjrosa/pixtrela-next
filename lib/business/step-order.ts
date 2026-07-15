export function getNextStepIndex(items: { index: number }[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.index)) + 1;
}

export function buildStepIndexUpdates(
  orderedDocumentIds: string[],
): { documentId: string; index: number }[] {
  return orderedDocumentIds.map((documentId, index) => ({
    documentId,
    index,
  }));
}

export function moveStepInOrder<T extends { documentId: string }>(
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

export function applySequentialStepIndices<T extends { index: number }>(
  items: T[],
): T[] {
  return items.map((item, index) => ({ ...item, index }));
}

export function reorderStepsByDrag<
  T extends { documentId: string; index: number },
>(items: T[], activeId: string, overId: string): T[] | null {
  const reordered = moveStepInOrder(items, activeId, overId);
  if (!reordered) return null;
  return applySequentialStepIndices(reordered);
}
