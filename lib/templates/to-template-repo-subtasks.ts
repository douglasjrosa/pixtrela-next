import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";
import type { TemplateSubTaskInput } from "@/lib/repos/templates";

function dependencyIndexesFrom(
  dependencies: TemplateSubTaskComponentInput["dependencies"],
): number[] {
  if (!Array.isArray(dependencies)) return [];
  return dependencies.filter(
    (value): value is number => typeof value === "number",
  );
}

/** Maps template form subtasks to repository write shape. */
export function toTemplateRepoSubTasks(
  subTasks: TemplateSubTaskComponentInput[] | undefined,
): TemplateSubTaskInput[] | undefined {
  if (!subTasks) return undefined;
  return subTasks.map((row, index) => ({
    name: row.name,
    qty: row.qty,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    index,
    expectedTime: row.expectedTime,
    dependencyIndexes: dependencyIndexesFrom(row.dependencies),
    linkedToPrevious: row.linkedToPrevious ?? false,
    subTaskCategoryId: row.subTaskCategoryId ?? null,
  }));
}
