import type { KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/format/datetime";
import { formatSpentOfExpected } from "@/lib/format/spent-of-expected";
import { cn } from "@/lib/utils";

import type { TaskRow } from "./types";

const CHECKBOX_CLASS = cn("size-4 rounded border border-input accent-primary");
const CENTER_CELL_CLASS = "text-center";

export interface TaskListRowProps {
  task: TaskRow;
  variant: "table" | "mobile";
  selectionEnabled?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function TaskListRow({
  task,
  variant,
  selectionEnabled = false,
  selected = false,
  onToggleSelect,
}: TaskListRowProps) {
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const tDuration = useTranslations("duration");
  const tCommon = useTranslations("common");
  const router = useRouter();

  function openTask(): void {
    router.push(`/tasks/${task.documentId}`);
  }

  const spentOfExpected = formatSpentOfExpected(
    task.totalTimeSpent,
    task.totalExpectedTime,
    (key, values) => tDuration(key, values),
    (spent, expected) => tManage("spentOfExpected", { spent, expected }),
  );
  const finishedSubTasks = tManage("finishedSubTasksValue", {
    finished: task.finishedSubTaskCount,
    total: task.totalSubTaskCount,
  });

  function handleRowClick(event: MouseEvent): void {
    if (
      event.target instanceof Element &&
      event.target.closest("[data-task-select]")
    ) {
      return;
    }
    openTask();
  }

  function handleRowKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTask();
    }
  }

  const interaction = {
    tabIndex: 0 as const,
    role: "link" as const,
    "aria-label": task.name,
    onClick: handleRowClick,
    onKeyDown: handleRowKeyDown,
  };

  const nameCell = (
    <>
      {task.name}
      {!task.active ? (
        <CardBadge className="ml-2">{tManage("inactive")}</CardBadge>
      ) : null}
    </>
  );

  const checkboxCell = selectionEnabled ? (
    <td className={cn("w-10 py-2", CENTER_CELL_CLASS)} data-task-select>
      <input
        type="checkbox"
        className={CHECKBOX_CLASS}
        checked={selected}
        aria-label={tCommon("selectRow", { name: task.name })}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggleSelect?.()}
      />
    </td>
  ) : null;

  if (variant === "table") {
    return (
      <tr
        {...interaction}
        className={cn(
          "border-b cursor-pointer hover:bg-muted/40",
          "focus-visible:bg-muted/40 focus-visible:outline-none",
        )}
      >
        {checkboxCell}
        <td className="py-2">{nameCell}</td>
        <td className={CENTER_CELL_CLASS}>{task.qty}</td>
        <td className={CENTER_CELL_CLASS}>
          {formatDatePtBr(task.deliveryDate)}
        </td>
        <td className={CENTER_CELL_CLASS}>{spentOfExpected}</td>
        <td className={CENTER_CELL_CLASS}>{finishedSubTasks}</td>
        <td className={CENTER_CELL_CLASS}>{tStatus(task.status)}</td>
      </tr>
    );
  }

  return (
    <li
      {...interaction}
      className={cn(
        "list-none border-b py-3 cursor-pointer hover:bg-muted/40",
        "focus-visible:bg-muted/40 focus-visible:outline-none",
      )}
    >
      <div className="flex items-start gap-3">
        {selectionEnabled ? (
          <div className="pt-0.5" data-task-select>
            <input
              type="checkbox"
              className={CHECKBOX_CLASS}
              checked={selected}
              aria-label={tCommon("selectRow", { name: task.name })}
              onClick={(event) => event.stopPropagation()}
              onChange={() => onToggleSelect?.()}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium">{nameCell}</div>
          <div className="text-muted-foreground text-sm">
            {tManage("qtyShort", { qty: task.qty })} | {tStatus(task.status)}
          </div>
          <div className="text-muted-foreground text-sm">{spentOfExpected}</div>
          <div className="text-muted-foreground text-sm">{finishedSubTasks}</div>
          <div className="text-muted-foreground text-sm">
            {formatDatePtBr(task.deliveryDate)}
          </div>
        </div>
      </div>
    </li>
  );
}
