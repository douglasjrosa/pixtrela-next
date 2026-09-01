"use client";

import { useTranslations } from "next-intl";

import { TaskProgressBarSkeleton } from "@/components/kanban/task-progress-bar-skeleton";
import { cn } from "@/lib/utils";

export function KanbanCardSkeleton({
  className,
  error = false,
}: {
  className?: string;
  error?: boolean;
}) {
  const t = useTranslations("kanban");

  return (
    <div
      role="status"
      aria-label={error ? t("loadMoreError") : t("loadingMoreCards")}
      className={cn(
        "relative min-w-0 rounded-md border bg-card p-3 shadow-sm",
        error && "border-destructive/40",
        className,
      )}
    >
      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-3">
        <TaskProgressBarSkeleton />
      </div>
      {error ? (
        <p className="mt-2 text-xs text-destructive">{t("loadMoreError")}</p>
      ) : null}
    </div>
  );
}
