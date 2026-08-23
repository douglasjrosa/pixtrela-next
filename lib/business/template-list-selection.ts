import type { TemplateListRow } from "@/components/templates/types";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllTemplatesSelected(
  templates: readonly TemplateListRow[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(templates, selectedIds);
}

export function toggleSelectAllTemplates(
  templates: readonly TemplateListRow[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(templates, selectedIds);
}

export function selectedTemplatesFromList(
  templates: readonly TemplateListRow[],
  selectedIds: readonly string[],
): TemplateListRow[] {
  return selectedRowsFromList(templates, selectedIds);
}

export function areAllSelectedTemplatesArchived(
  selected: readonly TemplateListRow[],
): boolean {
  return areAllSelectedRowsInactive(
    selected,
    (template) => !template.active,
  );
}
