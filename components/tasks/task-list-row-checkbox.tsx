"use client";

import { cn } from "@/lib/utils";

import { useTaskListSelection } from "./task-list-selection-context";

const CHECKBOX_CLASS = cn("size-4 rounded border border-input accent-primary");

export interface TaskListRowCheckboxProps {
  documentId: string;
  variant: "table" | "mobile";
  selectAll?: boolean;
  ariaLabel: string;
}

export function TaskListRowCheckbox({
  documentId,
  variant,
  selectAll = false,
  ariaLabel,
}: TaskListRowCheckboxProps) {
  const ctx = useTaskListSelection();
  if (!ctx) return null;

  const {
    allSelected,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
  } = ctx;

  const checked = selectAll
    ? allSelected
    : selectedIds.includes(documentId);

  function handleChange(): void {
    if (selectAll) {
      onToggleSelectAll();
      return;
    }
    onToggleSelect(documentId);
  }

  if (variant === "table") {
    return (
      <td className={cn("relative z-[1] w-10 py-2 text-center")} data-task-select>
        <input
          type="checkbox"
          className={CHECKBOX_CLASS}
          checked={checked}
          aria-label={ariaLabel}
          onClick={(event) => event.stopPropagation()}
          onChange={handleChange}
        />
      </td>
    );
  }

  return (
    <div className="relative z-[1] pt-0.5" data-task-select>
      <input
        type="checkbox"
        className={CHECKBOX_CLASS}
        checked={checked}
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
        onChange={handleChange}
      />
    </div>
  );
}
