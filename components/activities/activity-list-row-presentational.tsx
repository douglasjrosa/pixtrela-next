"use client";

import { CardBadge } from "@/components/ui/card";
import { ListRowCheckbox } from "@/components/ui/list-row-checkbox";
import { formatActivitySubtaskDisplayLabel } from "@/lib/business/activity-subtask-label";
import { formatColaboratorLabel } from "@/lib/business/activity-timestamp";
import { formatActivityDateTimePtBr } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

import { ActivityActionMark } from "./activity-action-mark";
import { useActivityEdit } from "./activity-edit-context";
import type { ActivityRow } from "./types";

const CENTER_CELL_CLASS = "text-center";
const ROW_BUTTON_CLASS =
  "text-inherit after:absolute after:inset-0 after:content-['']";

export type ActivityListRowLabels = {
  inactive: string;
  started: string;
  stoped: string;
  selectRow: string;
};

export interface ActivityListRowPresentationalProps {
  activity: ActivityRow;
  variant: "table" | "mobile";
  labels: ActivityListRowLabels;
  showCheckboxColumn?: boolean;
}

export function ActivityListRowPresentational({
  activity,
  variant,
  labels,
  showCheckboxColumn = false,
}: ActivityListRowPresentationalProps) {
  const onEdit = useActivityEdit();
  const colaborator = formatColaboratorLabel(
    activity.colaboratorName,
    activity.colaboratorCode,
  );
  const subtask = formatActivitySubtaskDisplayLabel({
    subTaskName: activity.subTaskName,
    taskQty: activity.taskQty,
    taskName: activity.taskName,
    taskCrmItemKey: activity.taskCrmItemKey,
    taskDeliveryDate: activity.taskDeliveryDate,
  });
  const actionLabel = activity.action === "started" ? labels.started : labels.stoped;
  const when = formatActivityDateTimePtBr(activity.timestamp);

  const actionMark = (
    <ActivityActionMark action={activity.action} ariaLabel={actionLabel} />
  );

  const nameCell = (
    <>
      {colaborator}
      {!activity.active ? (
        <CardBadge className="ml-2">{labels.inactive}</CardBadge>
      ) : null}
    </>
  );

  function openEdit(): void {
    onEdit?.(activity);
  }

  if (variant === "table") {
    return (
      <tr className="relative cursor-pointer border-b hover:bg-muted/40">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={activity.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className={CENTER_CELL_CLASS}>{actionMark}</td>
        <td className="py-2">
          <button
            type="button"
            className={ROW_BUTTON_CLASS}
            aria-label={subtask}
            onClick={openEdit}
          >
            {nameCell}
          </button>
        </td>
        <td className={CENTER_CELL_CLASS}>{when}</td>
        <td className={CENTER_CELL_CLASS}>{activity.qty}</td>
        <td className={CENTER_CELL_CLASS}>{activity.currencyAwarded}</td>
        <td className="py-2">{subtask}</td>
      </tr>
    );
  }

  return (
    <li className="relative list-none border-b hover:bg-muted/40">
      <div className="flex items-start gap-3">
        {showCheckboxColumn ? (
          <ListRowCheckbox
            documentId={activity.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer py-3 text-left"
          aria-label={subtask}
          onClick={openEdit}
        >
          <div className="flex items-center gap-2 text-base font-medium">
            {actionMark}
            {nameCell}
          </div>
          <div className="text-muted-foreground text-sm">{when}</div>
          <div className="text-muted-foreground text-sm">{activity.qty}</div>
          <div className="text-muted-foreground text-sm">
            {activity.currencyAwarded}
          </div>
          <div className="text-muted-foreground text-sm">{subtask}</div>
        </button>
      </div>
    </li>
  );
}
