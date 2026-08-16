"use client";

import { cn } from "@/lib/utils";

import { useTaskListSelection } from "./task-list-selection-context";

const CHECKBOX_CLASS = cn("size-4 rounded border border-input accent-primary");

export interface TaskListRowCheckboxProps {
  documentId: string;
  variant: "table" | "table-header" | "mobile";
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

  const checked = ctx
    ? selectAll
      ? ctx.allSelected
      : ctx.selectedIds.includes(documentId)
    : false;

  function handleChange(): void {
    if (!ctx) return;
    if (selectAll) {
      ctx.onToggleSelectAll();
      return;
    }
    ctx.onToggleSelect(documentId);
  }

  const checkbox = ctx ? (
    <input
      type="checkbox"
      className={CHECKBOX_CLASS}
      checked={checked}
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onChange={handleChange}
    />
  ) : (
    <span className={CHECKBOX_CLASS} aria-hidden />
  );

  if (variant === "table-header") {
    return <div className="flex justify-center">{checkbox}</div>;
  }

  if (variant === "table") {
    return (
      <td className={cn("w-10 py-2 text-center")} data-task-select>
        <div className="flex justify-center">{checkbox}</div>
      </td>
    );
  }

  return (
    <div className="w-4 shrink-0 pt-0.5" data-task-select>
      {checkbox}
    </div>
  );
}
