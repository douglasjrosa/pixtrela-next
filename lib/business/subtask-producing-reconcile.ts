const PRODUCING_STATUS = "producing";
const FINISHED_STATUS = "finished";

export type SubTaskStatusRow = {
  id: string;
  status: string | null;
  taskId: string;
};

/** Sub-task ids that have open sessions but are not marked producing yet. */
export function findSubTaskIdsNeedingProducingReconcile(
  rows: readonly SubTaskStatusRow[],
  activeColaboratorIdsBySubTaskId: ReadonlyMap<string, readonly string[]>,
): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    const status = String(row.status ?? "");
    if (status === PRODUCING_STATUS || status === FINISHED_STATUS) continue;
    const activeIds = activeColaboratorIdsBySubTaskId.get(row.id) ?? [];
    if (activeIds.length === 0) continue;
    ids.push(row.id);
  }
  return ids;
}

export function isSubTaskActivelyProducing(input: {
  status: string;
  startedAt?: string | null;
}): boolean {
  if (input.status === PRODUCING_STATUS) return true;
  return Boolean(input.startedAt);
}
