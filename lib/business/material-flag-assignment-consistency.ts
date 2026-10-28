const FINISHED_STATUS = "finished";

export type MaterialFlagAssignmentSnapshot = {
  subTaskStatus: string;
  subTaskCategoryId: string | null;
  flagCategoryId: string | null;
};

/** Stale or mismatched assignments that must not block production. */
export function isInconsistentMaterialFlagAssignment(
  row: MaterialFlagAssignmentSnapshot,
): boolean {
  if (row.subTaskStatus === FINISHED_STATUS) return true;
  if (!row.flagCategoryId) return true;
  if (!row.subTaskCategoryId) return true;
  return row.flagCategoryId !== row.subTaskCategoryId;
}
