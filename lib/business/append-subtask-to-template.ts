import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";

export type TaskSubtaskDependencyRef = {
  documentId: string;
  name: string;
};

export function mapDependencyIdsToTemplateIndexes(
  dependencyIds: string[],
  taskSubtasks: TaskSubtaskDependencyRef[],
  templateSubtaskNames: string[],
): number[] {
  const nameById = new Map(
    taskSubtasks.map((subtask) => [subtask.documentId, subtask.name] as const),
  );
  const indexes = new Set<number>();

  for (const dependencyId of dependencyIds) {
    const name = nameById.get(dependencyId);
    if (!name) continue;
    const index = templateSubtaskNames.indexOf(name);
    if (index >= 0) indexes.add(index);
  }

  return [...indexes].sort((left, right) => left - right);
}

export function appendSubtaskToTemplateComponents(
  existing: TemplateSubTaskComponentInput[],
  values: Pick<
    SubTaskFormInput,
    "name" | "qty" | "expectedTime" | "sharingType" | "maxSameTimeWorkers"
  >,
  dependencyIndexes: number[] = [],
): TemplateSubTaskComponentInput[] {
  const normalizedExisting = existing.map((row, index) => ({
    ...row,
    index,
  }));

  return [
    ...normalizedExisting,
    {
      name: values.name,
      qty: values.qty,
      expectedTime: values.expectedTime,
      sharingType: values.sharingType,
      maxSameTimeWorkers: values.maxSameTimeWorkers,
      index: normalizedExisting.length,
      dependencies: dependencyIndexes.length > 0 ? dependencyIndexes : null,
    },
  ];
}
