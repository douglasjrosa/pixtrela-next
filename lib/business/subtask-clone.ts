import { applySequentialSubTaskIndices } from "@/lib/business/subtask-order";

export const SUBTASK_CLONE_NAME_SUFFIX = " - CÓPIA";

export function buildClonedSubTaskName(name: string): string {
  return `${name}${SUBTASK_CLONE_NAME_SUFFIX}`;
}

/**
 * Inserts a copy of the subtask at `sourceArrayIndex`, immediately after the
 * source row. Reassigns sequential 0-based `index` values on every item.
 */
export function insertSubTaskCloneAt<T extends { name: string; index: number }>(
  items: T[],
  sourceArrayIndex: number,
): T[] {
  const source = items[sourceArrayIndex];
  if (!source) return items;

  const clone = {
    ...source,
    name: buildClonedSubTaskName(source.name),
  };
  const next = [...items];
  next.splice(sourceArrayIndex + 1, 0, clone);
  return applySequentialSubTaskIndices(next);
}
