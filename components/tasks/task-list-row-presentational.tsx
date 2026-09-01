import Link from "next/link";

import { CardBadge } from "@/components/ui/card";
import { formatCrmItemKeyLabel } from "@/lib/format/format-crm-item-key";
import { formatDatePtBr } from "@/lib/format/datetime";

import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import type { TaskRow } from "./types";

const CENTER_CELL_CLASS = "text-center";
const ROW_LINK_CLASS =
  "text-inherit after:absolute after:inset-0 after:content-['']";

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

  const crmItemKeyLabel = formatCrmItemKeyLabel(task.crmItemKey);

  if (variant === "table") {
    return (
      <tr className="relative cursor-pointer border-b hover:bg-muted/40">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={task.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className="py-2 text-muted-foreground tabular-nums">
          {crmItemKeyLabel}
        </td>
        <td className="py-2">
          <Link href={href} className={ROW_LINK_CLASS} aria-label={task.name}>
            {nameCell}
          </Link>
        </td>
        <td className={CENTER_CELL_CLASS}>{task.qty}</td>
        <td className={CENTER_CELL_CLASS}>
          {formatDatePtBr(task.deliveryDate)}
        </td>
        <td className={CENTER_CELL_CLASS}>{labels.spentOfExpected}</td>
        <td className={CENTER_CELL_CLASS}>{labels.finishedSubTasks}</td>
        <td className={CENTER_CELL_CLASS}>{labels.status}</td>
      </tr>
    );
  }

  return (
    <li className="list-none border-b hover:bg-muted/40">
      <div className="flex items-start gap-3">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={task.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <Link
          href={href}
          className="min-w-0 flex-1 cursor-pointer py-3"
          aria-label={task.name}
        >
          <div className="text-base font-medium">{nameCell}</div>
          {crmItemKeyLabel ? (
            <div className="text-muted-foreground text-sm tabular-nums">
              {crmItemKeyLabel}
            </div>
          ) : null}
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
