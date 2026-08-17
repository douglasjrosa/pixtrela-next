"use client";

import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import {
  KANBAN_PAUSED_BADGE_CLASS_NAME,
  KANBAN_PRODUCING_BADGE_CLASS_NAME,
  PAUSED_STATUS,
  PRODUCING_STATUS,
} from "@/lib/business/kanban-status-badge";
import type { SubTaskStatus } from "@/lib/business/subtask-queue";
import { cn } from "@/lib/utils";

export interface KioskSubtaskStatusBadgeProps {
  status: SubTaskStatus;
}

export function KioskSubtaskStatusBadge({ status }: KioskSubtaskStatusBadgeProps) {
  const tStatus = useTranslations("tasks.status");
  const isProducing = status === PRODUCING_STATUS;
  const isPaused = status === PAUSED_STATUS;

  return (
    <CardBadge
      className={cn(
        "w-fit uppercase",
        isProducing && KANBAN_PRODUCING_BADGE_CLASS_NAME,
        isPaused && KANBAN_PAUSED_BADGE_CLASS_NAME,
      )}
    >
      {tStatus(status)}
    </CardBadge>
  );
}
