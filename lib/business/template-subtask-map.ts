import { parseTemplateDependencyIndexes } from "@/lib/business/template-subtask-dependency-refs";
import type { TemplateSubTaskFormInput } from "@/lib/schemas/template-sub-task";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";

import { applySequentialSubTaskIndices } from "@/lib/business/subtask-order";

import { buildClonedSubTaskName } from "./subtask-clone";
import { createDraftSubTaskId, isDraftSubTaskId } from "./subtask-draft";

export interface TemplateSubTaskRow {
  rowKey: string;
  name: string;
  qty: number;
  index: number;
  expectedTime: number;
  sharingType: TemplateSubTaskComponentInput["sharingType"];
  maxSameTimeWorkers: number;
  dependencyIndexes: number[];
  isDraft?: boolean;
}

export function templateRowToFormValues(
  row: TemplateSubTaskRow,
): TemplateSubTaskFormInput {
  return {
    name: row.name,
    qty: row.qty,
    expectedTime: row.expectedTime,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    dependencyIds: row.dependencyIndexes.map(String),
  };
}

export function mapTemplateComponentsToRows(
  components: TemplateSubTaskComponentInput[],
): TemplateSubTaskRow[] {
  return components.map((component, position) => ({
    rowKey: `row-${position}`,
    name: component.name,
    qty: component.qty,
    index: component.index ?? position,
    expectedTime: component.expectedTime,
    sharingType: component.sharingType,
    maxSameTimeWorkers: component.maxSameTimeWorkers,
    dependencyIndexes: parseTemplateDependencyIndexes(component.dependencies),
  }));
}

export function mapTemplateRowsToComponents(
  rows: TemplateSubTaskRow[],
): TemplateSubTaskComponentInput[] {
  return rows.map((row, index) => ({
    name: row.name,
    qty: row.qty,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    index,
    expectedTime: row.expectedTime,
    dependencies: row.dependencyIndexes.length > 0 ? row.dependencyIndexes : null,
  }));
}

export function isDraftTemplateSubTaskRow(rowKey: string): boolean {
  return isDraftSubTaskId(rowKey);
}

export function createDraftTemplateSubTaskRow(
  source: TemplateSubTaskRow,
): TemplateSubTaskRow {
  return {
    ...source,
    rowKey: createDraftSubTaskId(),
    isDraft: true,
    name: buildClonedSubTaskName(source.name),
    dependencyIndexes: [...source.dependencyIndexes],
  };
}

export function insertDraftTemplateSubTaskCloneAt(
  items: TemplateSubTaskRow[],
  sourceArrayIndex: number,
): TemplateSubTaskRow[] {
  const source = items[sourceArrayIndex];
  if (!source) return items;

  const draft = createDraftTemplateSubTaskRow(source);
  const next = [...items];
  next.splice(sourceArrayIndex + 1, 0, draft);
  return applySequentialSubTaskIndices(
    next.map((item, index) => ({ ...item, index })),
  );
}

export function mergeServerTemplateSubTasksWithDrafts(
  serverRows: TemplateSubTaskRow[],
  drafts: TemplateSubTaskRow[],
): TemplateSubTaskRow[] {
  if (drafts.length === 0) return serverRows;

  const merged = [...serverRows];
  for (const draft of [...drafts].sort((a, b) => a.index - b.index)) {
    const insertAt = Math.min(Math.max(draft.index, 0), merged.length);
    merged.splice(insertAt, 0, draft);
  }
  return applySequentialSubTaskIndices(
    merged.map((item, index) => ({ ...item, index })),
  );
}
