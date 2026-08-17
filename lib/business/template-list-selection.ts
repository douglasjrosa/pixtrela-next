import type { TemplateListRow } from "@/components/templates/types";

export function toggleIdInSet(
  ids: readonly string[],
  id: string,
): string[] {
  if (ids.includes(id)) {
    return ids.filter((value) => value !== id);
  }
  return [...ids, id];
}

export function areAllTemplatesSelected(
  templates: readonly TemplateListRow[],
  selectedIds: readonly string[],
): boolean {
  if (templates.length === 0) return false;
  return templates.every((template) =>
    selectedIds.includes(template.documentId),
  );
}

export function toggleSelectAllTemplates(
  templates: readonly TemplateListRow[],
  selectedIds: readonly string[],
): string[] {
  if (areAllTemplatesSelected(templates, selectedIds)) {
    const visibleIds = new Set(templates.map((template) => template.documentId));
    return selectedIds.filter((id) => !visibleIds.has(id));
  }
  const merged = new Set(selectedIds);
  for (const template of templates) {
    merged.add(template.documentId);
  }
  return [...merged];
}

export function selectedTemplatesFromList(
  templates: readonly TemplateListRow[],
  selectedIds: readonly string[],
): TemplateListRow[] {
  const idSet = new Set(selectedIds);
  return templates.filter((template) => idSet.has(template.documentId));
}

export function areAllSelectedTemplatesArchived(
  selected: readonly TemplateListRow[],
): boolean {
  if (selected.length === 0) return false;
  return selected.every((template) => !template.active);
}
