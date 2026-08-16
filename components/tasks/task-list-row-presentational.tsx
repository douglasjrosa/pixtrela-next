import Link from "next/link";

import { CardBadge } from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

import { TaskListRowCheckbox } from "./task-list-row-checkbox";
import type { TaskRow } from "./types";

const CENTER_CELL_CLASS = "text-center";

export type TaskListRowLabels = {
  inactive: string;
  status: string;
  spentOfExpected: string;
  finishedSubTasks: string;
  qtyShort: string;
  selectRow: string;
};

export interface TaskListRowPresentationalProps {
  task: TaskRow;
  variant: "table" | "mobile";
  href: string;
  labels: TaskListRowLabels;
  showCheckboxColumn?: boolean;
}

export function TaskListRowPresentational({
  task,
  variant,
  href,
  labels,
  showCheckboxColumn = false,
}: TaskListRowPresentationalProps) {
  const nameCell = (
    <>
      {task.name}
      {!task.active ? (
        <CardBadge className="ml-2">{labels.inactive}</CardBadge>
      ) : null}
    </>
  );

  if (variant === "table") {
    return (
      <tr className="border-b hover:bg-muted/40">
        {showCheckboxColumn ? (
          <TaskListRowCheckbox
            documentId={task.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className="relative z-[1] py-2">
          <Link href={href} className="hover:underline">
            {nameCell}
          </Link>
        </td>
        <td className={cn("relative z-[1]", CENTER_CELL_CLASS)}>{task.qty}</td>
        <td className={cn("relative z-[1]", CENTER_CELL_CLASS)}>
          {formatDatePtBr(task.deliveryDate)}
        </td>
        <td className={cn("relative z-[1]", CENTER_CELL_CLASS)}>
          {labels.spentOfExpected}
        </td>
        <td className={cn("relative z-[1]", CENTER_CELL_CLASS)}>
          {labels.finishedSubTasks}
        </td>
        <td className={cn("relative z-[1]", CENTER_CELL_CLASS)}>
          {labels.status}
        </td>
      </tr>
    );
  }

  return (
    <li className="list-none border-b py-3 hover:bg-muted/40">
      <div className="relative flex items-start gap-3">
        {showCheckboxColumn ? (
          <TaskListRowCheckbox
            documentId={task.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <Link href={href} className="relative z-[1] min-w-0 flex-1">
          <div className="text-base font-medium">{nameCell}</div>
          <div className="text-muted-foreground text-sm">
            {labels.qtyShort} | {labels.status}
          </div>
          <div className="text-muted-foreground text-sm">
            {labels.spentOfExpected}
          </div>
          <div className="text-muted-foreground text-sm">
            {labels.finishedSubTasks}
          </div>
          <div className="text-muted-foreground text-sm">
            {formatDatePtBr(task.deliveryDate)}
          </div>
        </Link>
      </div>
    </li>
  );
}
