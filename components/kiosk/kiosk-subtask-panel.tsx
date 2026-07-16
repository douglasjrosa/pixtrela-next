"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  canCompleteSubTaskOnExit,
  getRemainingSubTaskQty,
  isFinishedSubTask,
  isLockedSubTask,
  shouldShowExitButton,
  shouldShowStartButton,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";
import { cn } from "@/lib/utils";
import { Duration } from "@/components/ui/duration";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

import { KioskExitSubtaskForm } from "./kiosk-exit-subtask-form";
import { SubtaskElapsedTimer } from "./subtask-elapsed-timer";

export interface KioskSubtaskPanelProps {
  subTasks: KioskSubTask[];
  allSubTasks?: KioskSubTask[];
  readOnly?: boolean;
  highlightProducing?: boolean;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
  pending?: boolean;
}

export function KioskSubtaskPanel({
  subTasks,
  allSubTasks,
  readOnly = false,
  highlightProducing = false,
  onStart,
  onExit,
  pending,
}: KioskSubtaskPanelProps) {
  const t = useTranslations("kiosk");
  const tStatus = useTranslations("tasks.status");
  const [exitingId, setExitingId] = useState<string | null>(null);
  const queueContext = allSubTasks ?? subTasks;

  return (
    <ul className="space-y-3">
      {subTasks.map((subTask) => {
        const finished = isFinishedSubTask(subTask);
        const locked = isLockedSubTask(subTask);
        const showStart =
          !readOnly && shouldShowStartButton(queueContext, subTask);
        const showExit =
          !readOnly && shouldShowExitButton(queueContext, subTask);
        const isProducing = subTask.status === "producing";
        const isExiting = exitingId === subTask.documentId;

        return (
          <li
            key={subTask.documentId}
            className={cn(
              "relative rounded-lg border p-4",
              finished && "border-muted bg-muted/40 opacity-80",
              locked && "bg-muted/50",
              highlightProducing &&
                isProducing &&
                "border-primary shadow-sm",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                {subTask.taskName ? (
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {subTask.taskName}
                  </p>
                ) : null}
                <p className="font-medium">{subTask.name}</p>
                <p className="text-sm text-muted-foreground">
                  {tStatus(subTask.status)}
                </p>
                {isProducing && subTask.startedAt ? (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      {t("startedAt")}: {formatDateTimePtBr(subTask.startedAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>{t("elapsed")}:</span>
                      <SubtaskElapsedTimer
                        startedAt={subTask.startedAt}
                        baseSeconds={subTask.timeSpent}
                      />
                    </p>
                  </div>
                ) : null}
                {finished ? (
                  <p className="text-sm text-muted-foreground">
                    {t("timeSpent")}:{" "}
                    <span className="tabular-nums">
                      <Duration seconds={subTask.timeSpent} />
                    </span>
                  </p>
                ) : null}
              </div>
              {!finished && !isExiting ? (
                <div className="flex shrink-0 gap-2">
                  {showStart ? (
                    <Button
                      type="button"
                      disabled={pending}
                      onClick={() => onStart?.(subTask.documentId)}
                    >
                      {t("start")}
                    </Button>
                  ) : null}
                  {showExit ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setExitingId(subTask.documentId)}
                    >
                      {t("exitSubtask")}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {locked ? (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                data-testid="subtask-locked-overlay"
              >
                <Lock
                  aria-hidden
                  className="size-12 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
              </div>
            ) : null}
            {isExiting && onExit ? (
              <div className="mt-4">
                <KioskExitSubtaskForm
                  sharingType={subTask.sharingType}
                  allowComplete={canCompleteSubTaskOnExit(subTask)}
                  maxQty={
                    subTask.sharingType === "qty"
                      ? getRemainingSubTaskQty(
                          subTask.targetQty,
                          subTask.completedQty,
                        )
                      : undefined
                  }
                  disabled={pending}
                  onCancel={() => setExitingId(null)}
                  onConfirm={(input) => {
                    void onExit(subTask.documentId, input);
                    setExitingId(null);
                  }}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
