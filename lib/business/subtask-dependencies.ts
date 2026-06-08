export function parseSubTaskDependencyIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );
}

export function normalizeSubTaskDependencyIds(
  dependencyIds: string[],
  currentDocumentId?: string,
): string[] {
  const unique = [...new Set(dependencyIds)];
  if (!currentDocumentId) return unique;
  return unique.filter((id) => id !== currentDocumentId);
}
