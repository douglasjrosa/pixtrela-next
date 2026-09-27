import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { SubtaskPresetListFilters } from "@/lib/schemas/subtask-preset-list-filters";
import type {
  SubtaskPresetListSort,
  SubtaskPresetListSortColumn,
} from "@/lib/schemas/subtask-preset-list-sort";
import { buildSubtaskPresetListSortHref } from "@/lib/subtask-presets/subtask-preset-list-sort-url";

export interface SubtaskPresetListSortHeaderLinkProps {
  column: SubtaskPresetListSortColumn;
  label: string;
  sort: SubtaskPresetListSort;
  filters: SubtaskPresetListFilters;
  align?: "left" | "center";
  className?: string;
}

export function SubtaskPresetListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: SubtaskPresetListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildSubtaskPresetListSortHref(filters, column);

  return (
    <ListSortHeaderLink
      href={href}
      label={label}
      active={active}
      direction={direction}
      align={align}
      className={className}
    />
  );
}
