import { nextJoinableSubTask } from "@/lib/business/kiosk-live-chain";
import type {
  KioskQueueUnit,
  OpenChainRun,
} from "@/lib/business/kiosk-queue-units";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

function addUnitIds(ids: Set<string>, unit: KioskQueueUnit): void {
  if (unit.type === "isolated") {
    ids.add(unit.subTask.documentId);
    return;
  }
  for (const member of unit.members) {
    ids.add(member.documentId);
  }
}

export function collectKioskQueueCatalogScope(input: {
  viewerId: string;
  producingUnits: readonly KioskQueueUnit[];
  pageUnits: readonly KioskQueueUnit[];
  openRuns: readonly OpenChainRun[];
  assignedSubTasks: readonly KioskSubTask[];
  fullCatalog: readonly KioskSubTask[];
  maxIntervalSeconds: number;
}): Set<string> {
  const ids = new Set<string>();
  for (const unit of input.producingUnits) addUnitIds(ids, unit);
  for (const unit of input.pageUnits) addUnitIds(ids, unit);
  for (const run of input.openRuns) {
    ids.add(run.chainHeadId);
  }

  const joinable = nextJoinableSubTask({
    viewerId: input.viewerId,
    subTasks: input.assignedSubTasks,
    catalog: input.fullCatalog,
    maxIntervalSeconds: input.maxIntervalSeconds,
  });
  if (joinable) ids.add(joinable.documentId);

  return ids;
}

export function filterCatalogByScope(
  catalog: readonly KioskSubTask[],
  scope: ReadonlySet<string>,
): KioskSubTask[] {
  return catalog.filter((item) => scope.has(item.documentId));
}

/** Merge by documentId; incoming wins, previous ids are never dropped. */
export function mergeKioskCatalog(
  previous: readonly KioskSubTask[],
  incoming: readonly KioskSubTask[],
): KioskSubTask[] {
  const byId = new Map(previous.map((item) => [item.documentId, item]));
  for (const item of incoming) {
    byId.set(item.documentId, item);
  }
  return [...byId.values()];
}
