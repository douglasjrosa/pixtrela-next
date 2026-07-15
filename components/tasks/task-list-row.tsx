import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/format/datetime";
import { formatSpentOfExpected } from "@/lib/format/spent-of-expected";
import { cn } from "@/lib/utils";

import type { TaskRow } from "./types";

export interface TaskListRowProps {
  task: TaskRow;
  variant: "table" | "mobile";
}

export function TaskListRow({ task, variant }: TaskListRowProps) {
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const tDuration = useTranslations("duration");
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

  const interaction = {
    tabIndex: 0 as const,
    role: "link" as const,
    "aria-label": task.name,
    onClick: openTask,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTask();
      }
    },
  };

  const nameCell = (
    <>
      {task.name}
      {!task.active ? (
        <CardBadge className="ml-2">{tManage("inactive")}</CardBadge>
      ) : null}
    </>
  );

  if (variant === "table") {
    return (
      <tr
        {...interaction}
        className={cn(
          "border-b cursor-pointer hover:bg-muted/40",
          "focus-visible:bg-muted/40 focus-visible:outline-none",
        )}
      >
        <td className="py-2">{nameCell}</td>
        <td>{task.qty}</td>
        <td>{formatDatePtBr(task.deliveryDate)}</td>
        <td>{spentOfExpected}</td>
        <td>{tStatus(task.status)}</td>
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
      <div className="text-base font-medium">{nameCell}</div>
      <div className="text-muted-foreground text-sm">
        {tManage("qtyShort", { qty: task.qty })} | {tStatus(task.status)}
      </div>
      <div className="text-muted-foreground text-sm">{spentOfExpected}</div>
      <div className="text-muted-foreground text-sm">
        {formatDatePtBr(task.deliveryDate)}
      </div>
    </li>
  );
}
