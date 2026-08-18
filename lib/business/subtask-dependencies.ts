const FINISHED_STATUS = "finished";
const LOCKED_ACTIVATION_STATUS = "locked";

export type SubTaskDependencyRow = {
  documentId: string;
  status: string;
  activationStatus?: string | null;
  dependencies?: unknown;
  hasAssignedFlags?: boolean;
};

export function parseSubTaskDependencyIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0,
    );
  }
  return [];
}

export function isPredecessorSatisfied(
  predecessor:
    | Pick<SubTaskDependencyRow, "status" | "hasAssignedFlags">
    | undefined,
): boolean {
  if (!predecessor) return false;
  return (
    predecessor.status === FINISHED_STATUS ||
    predecessor.hasAssignedFlags === true
  );
}

export function areSubTaskDependenciesSatisfied(
  dependencyIds: string[],
  siblingsById: Map<
    string,
    Pick<SubTaskDependencyRow, "status" | "hasAssignedFlags">
  >,
): boolean {
  if (dependencyIds.length === 0) return false;
  return dependencyIds.every((id) =>
    isPredecessorSatisfied(siblingsById.get(id)),
  );
}

function isLockedForDependencyUnlock(
  activationStatus: string | null | undefined,
): boolean {
  return (activationStatus ?? LOCKED_ACTIVATION_STATUS) === LOCKED_ACTIVATION_STATUS;
}

export function findLockedSubTasksToUnlock(
  siblings: SubTaskDependencyRow[],
): string[] {
  const siblingsById = new Map(
    siblings.map((sibling) => [sibling.documentId, sibling]),
  );

  return siblings
    .filter((sibling) => isLockedForDependencyUnlock(sibling.activationStatus))
    .filter((sibling) => {
      const dependencyIds = parseSubTaskDependencyIds(sibling.dependencies);
      return areSubTaskDependenciesSatisfied(dependencyIds, siblingsById);
    })
    .map((sibling) => sibling.documentId);
}

export function normalizeSubTaskDependencyIds(
  dependencyIds: string[],
  currentDocumentId?: string,
): string[] {
  const unique = [...new Set(dependencyIds)];
  if (!currentDocumentId) return unique;
  return unique.filter((id) => id !== currentDocumentId);
}
