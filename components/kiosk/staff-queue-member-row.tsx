"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";

import { KanbanFloatingCountBadge } from "@/components/kanban/kanban-floating-count-badge";
import { AppImage } from "@/components/media/app-image";
import { formatActivitySubtaskQueueBadges } from "@/lib/business/activity-subtask-label";
import { shouldShowAssignWarn } from "@/lib/business/assign-warn";
import { DEFAULT_ASSIGN_WARN_MAX } from "@/lib/business/assign-warn-max";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { formatActivityDateTimePtBr } from "@/lib/format/datetime";
import type { StaffQueueMember } from "@/lib/kiosk/load-staff-queues-grouped";
import { activityActionBadgeBackgroundClass } from "@/lib/ui/activity-action-badge";
import { cn } from "@/lib/utils";
import { LeaderRoleBadge } from "@/components/ui/leader-role-badge";

export interface StaffQueueMemberRowProps {
  member: StaffQueueMember;
  href: string;
  assignWarnMax?: number;
}

/** Single colaborator row on staff queue lists (app /queues and kiosk staff). */
export function StaffQueueMemberRow({
  member,
  href,
  assignWarnMax = DEFAULT_ASSIGN_WARN_MAX,
}: StaffQueueMemberRowProps) {
  const tActivities = useTranslations("activities");
  const tKanban = useTranslations("kanban");

  const activityBadges = member.lastActivity
    ? formatActivitySubtaskQueueBadges({
        subTaskName: member.lastActivity.subTaskName,
        taskQty: member.lastActivity.taskQty,
        taskName: member.lastActivity.taskName,
        taskCrmItemKey: member.lastActivity.taskCrmItemKey,
        taskDeliveryDate: member.lastActivity.taskDeliveryDate,
      })
    : null;
  const actionLabel = member.lastActivity
    ? member.lastActivity.action === "started"
      ? tActivities("action.started")
      : tActivities("action.stoped")
    : "";

  const showAssignWarn = shouldShowAssignWarn(
    member.assignedCount,
    assignWarnMax,
  );
  const identityLine = `${member.name} ${member.code ?? "—"}`;
  const avatarUrl = toBrowserMediaUrl(
    member.avatarUrl ?? member.facePhotoUrl ?? null,
  );

  return (
    <Link
      href={href}
      className={cn(
        "flex gap-3 px-3 py-2.5 text-left",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2",
      )}
    >
      <div className="flex shrink-0 self-stretch items-center">
        <span className="relative">
          <span
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center",
              "overflow-hidden rounded-full border bg-background",
            )}
          >
            {avatarUrl ? (
              <AppImage src={avatarUrl} fill className="object-cover" alt="" />
            ) : (
              <User className="size-5 text-muted-foreground" aria-hidden />
            )}
          </span>
          {showAssignWarn ? (
            <KanbanFloatingCountBadge
              count={member.assignedCount}
              display={String(member.assignedCount)}
              ariaLabel={tKanban("assignWarnColaboratorBadge", {
                name: member.name,
                count: member.assignedCount,
              })}
            />
          ) : null}
        </span>
      </div>
      <div className="min-w-0 flex-1">
      <div
        className={cn(
          "flex w-full min-w-0 flex-wrap items-center gap-2",
          "min-[501px]:justify-between",
        )}
      >
        <span
          className={cn(
            "inline-flex min-w-0 basis-full items-center gap-1.5",
            "min-[501px]:basis-auto min-[501px]:shrink",
          )}
        >
          <span className="truncate font-medium tabular-nums">{identityLine}</span>
          {member.isLeader ? <LeaderRoleBadge /> : null}
        </span>
        {activityBadges ? (
          <span
            className={cn(
              "inline-flex min-w-0 flex-1 basis-[calc(50%-0.25rem)]",
              "items-center justify-center truncate rounded px-1.5 py-0.5",
              "text-center text-xs font-medium bg-muted text-muted-foreground",
              "min-[501px]:max-w-[40%] min-[501px]:flex-none min-[501px]:basis-auto",
              "min-[501px]:shrink min-[501px]:text-left",
            )}
          >
            {activityBadges.tertiary}
          </span>
        ) : null}
        {member.lastActivity ? (
          <span
            className={cn(
              "inline-flex min-w-0 flex-1 basis-[calc(50%-0.25rem)]",
              "items-center justify-center truncate rounded px-1.5 py-0.5",
              "text-center text-xs font-medium tabular-nums text-white",
              "min-[501px]:w-fit min-[501px]:flex-none min-[501px]:basis-auto",
              "min-[501px]:shrink-0",
              activityActionBadgeBackgroundClass(member.lastActivity.action),
            )}
            aria-label={actionLabel}
          >
            {formatActivityDateTimePtBr(member.lastActivity.timestamp)}
          </span>
        ) : null}
      </div>

      {member.lastActivity && activityBadges ? (
        <div className="mt-1.5 flex w-full min-w-0 flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex min-w-0 flex-1 basis-full items-center",
              "justify-center rounded px-1.5 py-0.5 text-center",
              "text-xs font-medium min-[501px]:basis-[calc(50%-0.25rem)]",
              "bg-primary text-primary-foreground",
            )}
          >
            <span className="min-w-0 truncate">{activityBadges.primary}</span>
          </span>
          <span
            className={cn(
              "inline-flex min-w-0 flex-1 basis-full items-center",
              "justify-center rounded px-1.5 py-0.5 text-center",
              "text-xs font-medium min-[501px]:basis-[calc(50%-0.25rem)]",
              "bg-secondary text-secondary-foreground",
            )}
          >
            <span className="min-w-0 truncate">{activityBadges.secondary}</span>
          </span>
        </div>
      ) : null}
      </div>
    </Link>
  );
}
