const PRODUCING_STATUS = "producing";

export type SubTaskStatusRow = {
  id: string;
  status: string | null;
  taskId: string;
};

/**
 * Sub-task ids that have open sessions but are not marked producing yet.
 * Includes finished rows with orphan sessions so queue load can reopen them.
 */
export function findSubTaskIdsNeedingProducingReconcile(
  rows: readonly SubTaskStatusRow[],
  activeColaboratorIdsBySubTaskId: ReadonlyMap<string, readonly string[]>,
): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    const status = String(row.status ?? "");
    if (status === PRODUCING_STATUS) continue;
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

export type QtyCompleteReconcileRow = {
  id: string;
  status: string | null;
  qty: number;
  sharingType: string | null;
  taskId: string;
};

/**
 * Rows that may need a producing-status write: open viewer sessions or
 * any sub-task that already has active workers.
 */
export function selectRowsForProducingReconcile<T extends { id: string }>(
  rows: readonly T[],
  input: {
    openSessionIds: readonly string[];
    activeColaboratorIdsBySubTaskId: ReadonlyMap<string, readonly string[]>;
  },
): T[] {
  const openIds = new Set(input.openSessionIds);
  return rows.filter((row) => {
    if (openIds.has(row.id)) return true;
    return (input.activeColaboratorIdsBySubTaskId.get(row.id) ?? []).length > 0;
  });
}

/**
 * Qty rows that may need a finished write: paused/waiting, no active
 * workers, and completed qty already meeting the target.
 */
export function selectRowsForQtyCompleteReconcile<
  T extends QtyCompleteReconcileRow,
>(
  rows: readonly T[],
  input: {
    completedQtyBySubTaskId: ReadonlyMap<string, number>;
    activeColaboratorIdsBySubTaskId: ReadonlyMap<string, readonly string[]>;
  },
): T[] {
  return rows.filter((row) => {
    if (row.sharingType !== "qty") return false;
    const status = String(row.status ?? "");
    if (status !== "paused" && status !== "waiting") return false;
    if ((input.activeColaboratorIdsBySubTaskId.get(row.id) ?? []).length > 0) {
      return false;
    }
    const completed = input.completedQtyBySubTaskId.get(row.id) ?? 0;
    return completed >= Math.max(1, row.qty);
  });
}
