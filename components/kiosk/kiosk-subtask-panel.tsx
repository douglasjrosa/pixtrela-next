"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  canStartSubTask,
  canStopSubTask,
  getRemainingSubTaskQty,
  isFinishedSubTask,
  isLockedSubTask,
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
  readOnly?: boolean;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
  pending?: boolean;
}

export function KioskSubtaskPanel({
  subTasks,
  readOnly = false,
  onStart,
  onExit,
  pending,
}: KioskSubtaskPanelProps) {
  const t = useTranslations("kiosk");
  const tStatus = useTranslations("tasks.status");
  const [exitingId, setExitingId] = useState<string | null>(null);

  if (subTasks.length === 0) {
    return <p role="status">{t("noTasks")}</p>;
  }

  return (
    <ul className="space-y-3">
      {subTasks.map((subTask) => {
        const finished = isFinishedSubTask(subTask);
        const locked = isLockedSubTask(subTask);
        const startable = canStartSubTask(subTasks, subTask.documentId);
        const stoppable = canStopSubTask(subTask);
        const isProducing = subTask.status === "producing";
        const isExiting = exitingId === subTask.documentId;

        return (
          <li
            key={subTask.documentId}
            className={cn(
              "relative rounded-lg border p-4",
              finished && "border-muted bg-muted/40 opacity-80",
              locked && "bg-muted/50",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">{subTask.name}</p>
                <p className="text-sm text-muted-foreground">
                  {tStatus(subTask.status)}
                </p>
                {isProducing && subTask.startedAt ? (
                  <div className="text-sm text-muted-foreground">
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
              {!finished && !isExiting && !readOnly ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={!startable || pending}
                    onClick={() => onStart?.(subTask.documentId)}
                  >
                    {t("start")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!stoppable || pending}
                    onClick={() => setExitingId(subTask.documentId)}
                  >
                    {t("exitSubtask")}
                  </Button>
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
                  maxQty={
                    subTask.sharingType === "qty"
                      ? getRemainingSubTaskQty(subTask.qty, subTask.completedQty)
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
