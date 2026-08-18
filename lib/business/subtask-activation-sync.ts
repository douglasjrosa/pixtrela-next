import {
  isSubTaskAtWorkerCapacity,
} from "@/lib/business/subtask-active-workers";
import {
  isPredecessorSatisfied,
  parseSubTaskDependencyIds,
  type SubTaskDependencyRow,
} from "@/lib/business/subtask-dependencies";

const FINISHED_STATUS = "finished";
const DISABLED_ACTIVATION_STATUS = "disabled";
const LOCKED_ACTIVATION_STATUS = "locked";
const PRODUCING_STATUS = "producing";

export type AutomaticActivationStatus = "locked" | "unlocked";

export type SubTaskActivationSyncRow = SubTaskDependencyRow & {
  maxSameTimeWorkers: number;
  activeWorkerCount: number;
};

export function areAllDependencySubTasksFinished(
  dependencyIds: string[],
  siblingsById: Map<
    string,
    Pick<SubTaskDependencyRow, "status" | "hasAssignedFlags">
  >,
): boolean {
  if (dependencyIds.length === 0) return true;
  return dependencyIds.every((documentId) =>
    isPredecessorSatisfied(siblingsById.get(documentId)),
  );
}

/**
 * Derives locked/unlocked from sub-task status and dependency completion.
 * Returns null when activationStatus is disabled and must not be changed.
 */
export function computeAutomaticActivationStatus(
  subtask: SubTaskActivationSyncRow,
  siblingsById: Map<
    string,
    Pick<SubTaskDependencyRow, "status" | "hasAssignedFlags">
  >,
): AutomaticActivationStatus | null {
  const currentActivation = subtask.activationStatus ?? LOCKED_ACTIVATION_STATUS;
  if (currentActivation === DISABLED_ACTIVATION_STATUS) return null;

  if (
    isSubTaskAtWorkerCapacity(
      subtask.maxSameTimeWorkers,
      subtask.activeWorkerCount,
    )
  ) {
    return "locked";
  }

  if (subtask.status === PRODUCING_STATUS) return "unlocked";

  const dependencyIds = parseSubTaskDependencyIds(subtask.dependencies);
  const dependenciesFinished = areAllDependencySubTasksFinished(
    dependencyIds,
    siblingsById,
  );
  const ownNotFinished = subtask.status !== FINISHED_STATUS;

  if (ownNotFinished && dependenciesFinished) return "unlocked";
  return "locked";
}

export function resolveSubTaskActivationStatusUpdates(
  siblings: SubTaskActivationSyncRow[],
): Map<string, AutomaticActivationStatus> {
  const siblingsById = new Map(
    siblings.map((sibling) => [sibling.documentId, sibling]),
  );
  const updates = new Map<string, AutomaticActivationStatus>();

  for (const sibling of siblings) {
    const nextStatus = computeAutomaticActivationStatus(sibling, siblingsById);
    if (nextStatus === null) continue;

    const currentStatus = sibling.activationStatus ?? LOCKED_ACTIVATION_STATUS;
    if (currentStatus === nextStatus) continue;

    updates.set(sibling.documentId, nextStatus);
  }

  return updates;
}
