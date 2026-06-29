import { applySequentialSubTaskIndices } from "@/lib/business/subtask-order";

type RemovableTemplateSubTask = {
  rowKey: string;
  index: number;
  dependencyIndexes: number[];
};

export function removeTemplateSubTaskAt<T extends RemovableTemplateSubTask>(
  items: T[],
  rowKey: string,
): T[] {
  const removed = items.find((item) => item.rowKey === rowKey);
  if (!removed) return items;

  const removedIndex = removed.index;
  const filtered = items
    .filter((item) => item.rowKey !== rowKey)
    .map((item) => ({
      ...item,
      dependencyIndexes: item.dependencyIndexes
        .filter((dep) => dep !== removedIndex)
        .map((dep) => (dep > removedIndex ? dep - 1 : dep)),
    }));

  return applySequentialSubTaskIndices(
    filtered.map((item, index) => ({ ...item, index })),
  );
}
