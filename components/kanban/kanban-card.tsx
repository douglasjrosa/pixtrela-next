"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { CardBadge } from "@/components/ui/card";
import { LabeledDateBadge } from "@/components/ui/labeled-date-badge";
import { resolveKanbanDeliveryDateTone } from "@/lib/business/kanban-delivery-badge";
import {
  KANBAN_PAUSED_BADGE_CLASS_NAME,
  KANBAN_PRODUCING_BADGE_CLASS_NAME,
  PAUSED_STATUS,
  PRODUCING_STATUS,
} from "@/lib/business/kanban-status-badge";
import { toKanbanTaskId } from "@/lib/business/kanban-task-order";
import {
  isCompletedTaskStatus,
  needsLiveBoardProgress,
  shouldShowKanbanTaskProgress,
} from "@/lib/business/task-progress";
import { formatTaskDisplayTitle } from "@/lib/business/task-display-title";
import { useLiveProgressClock } from "@/hooks/use-live-progress-clock";
import { cn } from "@/lib/utils";

import { KanbanFloatingCountBadge } from "./kanban-floating-count-badge";
import { TaskProgressBar } from "./task-progress-bar";
import { TaskProgressBarSkeleton } from "./task-progress-bar-skeleton";
import { TimeMetrics } from "./time-metrics";
import type { KanbanTask } from "./types";

const KANBAN_CLICK_ACTIVATION_DISTANCE_PX = 8;
const FINISHED_STATUS = "finished";

export interface KanbanCardProps {
  task: KanbanTask;
  onTaskClick?: (task: KanbanTask) => void;
}

function KanbanUnassignedFloatingBadge({ count }: { count: number }) {
  const t = useTranslations("kanban");
  return (
    <KanbanFloatingCountBadge
      count={count}
      ariaLabel={t("unassignedSubtasksBadge", { count })}
    />
  );
}

function FinishedParticipantCount({ count }: { count: number }) {
  const t = useTranslations("kanban");
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground"
      aria-label={t("finishedParticipants", { count })}
    >
      <Users className="size-3.5 shrink-0" aria-hidden />
      <span>{count}</span>
    </span>
  );
}

function KanbanTaskStatusBadge({
  status,
  activeCount,
}: {
  status: KanbanTask["status"];
  activeCount: number;
}) {
  const tStatus = useTranslations("tasks.status");
  const tKanban = useTranslations("kanban");
  const isProducing = status === PRODUCING_STATUS;
  const isPaused = status === PAUSED_STATUS;
  const showActive = isProducing && activeCount > 0;

  return (
    <CardBadge
      className={cn(
        "inline-flex shrink-0 items-center gap-1",
        isProducing && KANBAN_PRODUCING_BADGE_CLASS_NAME,
        isPaused && KANBAN_PAUSED_BADGE_CLASS_NAME,
      )}
      aria-label={
        showActive
          ? tKanban("producingWithActiveColaborators", {
              status: tStatus(status),
              count: activeCount,
            })
          : undefined
      }
    >
      {tStatus(status)}
      {showActive ? (
        <>
          <User aria-hidden className="size-3" />
          <span className="tabular-nums">{activeCount}</span>
        </>
      ) : null}
    </CardBadge>
  );
}

export function KanbanCardSurface({
  task,
  className,
}: {
  task: KanbanTask;
  className?: string;
}) {
  const tKanban = useTranslations("kanban");
  const deliveryTone = resolveKanbanDeliveryDateTone(
    task.deliveryDate,
    new Date(),
  );
  const showProgress = shouldShowKanbanTaskProgress(task.status);
  const liveClock = needsLiveBoardProgress(task.status);
  const nowMs = useLiveProgressClock(liveClock, task.progressNowMs);
  const unassignedCount = task.unassignedSubTaskCount ?? 0;
  const activeCount = task.activeColaboratorCount ?? 0;
  const participantCount = task.participantCount ?? 0;
  const isCompleted = isCompletedTaskStatus(task.status);
  const hideStatusBadge = task.status === FINISHED_STATUS;

  return (
    <div
      className={cn(
        "relative rounded-md border bg-card p-3 shadow-sm",
        className,
      )}
    >
      <KanbanUnassignedFloatingBadge count={unassignedCount} />
      <p className="font-medium">
        {formatTaskDisplayTitle(task.qty, task.name)}
      </p>
      {isCompleted ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <TimeMetrics
            expectedTime={task.totalExpectedTime}
            timeSpent={task.totalTimeSpent}
          />
          <FinishedParticipantCount count={participantCount} />
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <LabeledDateBadge
            label={tKanban("deliveryForecast")}
            value={task.deliveryDate}
            tone={deliveryTone}
          />
          {isCompleted ? (
            <LabeledDateBadge
              label={tKanban("completion")}
              value={task.endedAt}
              showTime
            />
          ) : null}
        </div>
        {!hideStatusBadge ? (
          <KanbanTaskStatusBadge
            status={task.status}
            activeCount={activeCount}
          />
        ) : null}
      </div>
      {showProgress ? (
        <div className="mt-3">
          {task.progressPending || !task.progressInput ? (
            <TaskProgressBarSkeleton />
          ) : (
            <TaskProgressBar
              totalTimeSpent={task.totalTimeSpent}
              totalExpectedTime={task.totalExpectedTime}
              progressInput={task.progressInput}
              nowMs={nowMs}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function KanbanCardDragOverlay({ task }: { task: KanbanTask }) {
  return (
    <KanbanCardSurface
      task={task}
      className="cursor-grabbing shadow-lg ring-2 ring-ring"
    />
  );
}

export function KanbanCard({ task, onTaskClick }: KanbanCardProps) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: toKanbanTaskId(task.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    listeners?.onPointerDown?.(event);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    listeners?.onPointerUp?.(event);

    if (!pointerStart.current || !onTaskClick) {
      pointerStart.current = null;
      return;
    }

    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;

    if (Math.hypot(dx, dy) < KANBAN_CLICK_ACTIVATION_DISTANCE_PX) {
      onTaskClick(task);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative overflow-visible",
        onTaskClick && "cursor-pointer",
        isDragging && "opacity-40",
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...attributes}
    >
      <KanbanCardSurface task={task} />
    </div>
  );
}
