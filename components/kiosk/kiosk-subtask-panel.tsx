"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  canStartSubTask,
  canStopSubTask,
  getRemainingSubTaskQty,
  isFinishedSubTask,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";
import { Duration } from "@/components/ui/duration";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

import { KioskExitSubtaskForm } from "./kiosk-exit-subtask-form";
import { SubtaskElapsedTimer } from "./subtask-elapsed-timer";

export interface KioskSubtaskPanelProps {
  subTasks: KioskSubTask[];
  onStart: (documentId: string) => void | Promise<void>;
  onExit: (documentId: string, input: KioskExitInput) => void | Promise<void>;
  pending?: boolean;
}

export function KioskSubtaskPanel({
  subTasks,
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
        const startable = canStartSubTask(subTasks, subTask.documentId);
        const stoppable = canStopSubTask(subTask);
        const isProducing = subTask.status === "producing";
        const isExiting = exitingId === subTask.documentId;

        return (
          <li
            key={subTask.documentId}
            className={`rounded-lg border p-4 ${
              finished ? "border-muted bg-muted/40 opacity-80" : ""
            }`}
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
              {!finished && !isExiting ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={!startable || pending}
                    onClick={() => onStart(subTask.documentId)}
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
            {isExiting ? (
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
