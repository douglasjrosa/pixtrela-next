export function parseTemplateDependencyIndexes(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is number =>
      typeof entry === "number" && Number.isInteger(entry) && entry >= 0,
  );
}

export function templateDependencyIndexToUiId(index: number): string {
  return String(index);
}

export function parseTemplateDependencyUiIds(ids: string[]): number[] {
  const indexes = ids
    .map((id) => Number(id))
    .filter((index) => Number.isInteger(index) && index >= 0);
  return [...new Set(indexes)];
}

export function remapTemplateDependencyIndexes<
  T extends { rowKey: string; index: number; dependencyIndexes: number[] },
>(before: T[], after: T[]): T[] {
  const oldIndexByKey = new Map(before.map((item) => [item.rowKey, item.index]));
  const newIndexByOldIndex = new Map<number, number>();

  for (const item of after) {
    const oldIndex = oldIndexByKey.get(item.rowKey);
    if (oldIndex !== undefined) {
      newIndexByOldIndex.set(oldIndex, item.index);
    }
  }

  return after.map((item) => ({
    ...item,
    dependencyIndexes: item.dependencyIndexes
      .map((dep) => newIndexByOldIndex.get(dep))
      .filter((dep): dep is number => dep !== undefined),
  }));
}
