"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import type { KioskQueueUnit } from "@/lib/business/kiosk-queue-units";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
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
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

import { KioskActionButton } from "./kiosk-action-button";
import { KioskChainGroupCard } from "./kiosk-chain-group-card";
import { KioskExitSubtaskForm } from "./kiosk-exit-subtask-form";
import { KioskSubtaskProducingMetrics } from "./kiosk-subtask-producing-metrics";

export interface KioskSubtaskPanelProps {
  subTasks?: KioskSubTask[];
  units?: KioskQueueUnit[];
  allSubTasks?: KioskSubTask[];
  readOnly?: boolean;
  highlightProducing?: boolean;
  flashDocumentId?: string | null;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
  onStartChain?: (headId: string) => void | Promise<void>;
  onConfirmChainStop?: (
    chainRunId: string,
    answers: ChainStopAnswer[],
  ) => void | Promise<void>;
  onAdvanceChain?: (chainRunId: string) => void | Promise<void>;
  pending?: boolean;
}

function unitsFromSubTasks(subTasks: KioskSubTask[]): KioskQueueUnit[] {
  return subTasks.map((subTask) => ({
    type: "isolated" as const,
    subTask,
    helperMode: false,
    showStart: shouldShowStartButton(subTasks, subTask),
  }));
}

export function KioskSubtaskPanel({
  subTasks = [],
  units,
  allSubTasks,
  readOnly = false,
  highlightProducing = false,
  flashDocumentId,
  onStart,
  onExit,
  onStartChain,
  onConfirmChainStop,
  onAdvanceChain,
  pending,
}: KioskSubtaskPanelProps) {
  const t = useTranslations("kiosk");
  const tStatus = useTranslations("tasks.status");
  const [exitingId, setExitingId] = useState<string | null>(null);
  const queueContext = allSubTasks ?? subTasks;
  const resolvedUnits = units ?? unitsFromSubTasks(subTasks);

  return (
    <ul className="space-y-3">
      {resolvedUnits.map((unit) => {
        if (unit.type === "group") {
          return (
            <KioskChainGroupCard
              key={`group-${unit.headId}`}
              unit={unit}
              readOnly={readOnly}
              pending={pending}
              flash={unit.memberIds.includes(flashDocumentId ?? "")}
              onStartChain={onStartChain}
              onConfirmChainStop={onConfirmChainStop}
              onAdvanceChain={onAdvanceChain}
            />
          );
        }

        const subTask = unit.subTask;
        const helperMode = unit.helperMode;
        const finished = isFinishedSubTask(subTask);
        const locked = isLockedSubTask(subTask);
        const showStart = !readOnly && unit.showStart;
        const showExit =
          !readOnly && shouldShowExitButton(queueContext, subTask);
        const isProducing = subTask.status === "producing";
        const isExiting = exitingId === subTask.documentId;
        const isFlashing = flashDocumentId === subTask.documentId;
        const allowComplete = helperMode
          ? false
          : canCompleteSubTaskOnExit(subTask);

        return (
          <li
            key={subTask.documentId}
            className={cn(
              "relative rounded-2xl border bg-card p-4 transition-colors duration-300",
              finished && "border-muted bg-muted opacity-80",
              locked && "bg-muted",
              highlightProducing &&
                isProducing &&
                "border-l-4 border-l-[var(--success)] shadow-sm",
              isFlashing && "bg-muted",
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="min-w-0 space-y-1">
                {subTask.taskName ? (
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {subTask.taskName}
                  </p>
                ) : null}
                <p className="text-lg font-semibold leading-snug">{subTask.name}</p>
                <p className="text-base text-muted-foreground">
                  {tStatus(subTask.status)}
                </p>
                {isProducing && subTask.startedAt ? (
                  <KioskSubtaskProducingMetrics
                    startedAt={subTask.startedAt}
                    timeSpent={subTask.timeSpent}
                    expectedTime={subTask.expectedTime}
                  />
                ) : null}
                {finished ? (
                  <p className="text-base text-muted-foreground">
                    {t("timeSpent")}:{" "}
                    <span className="tabular-nums">
                      <Duration seconds={subTask.timeSpent} />
                    </span>
                  </p>
                ) : null}
              </div>
              {!finished && !isExiting ? (
                <div className="flex w-full flex-col gap-2">
                  {showStart ? (
                    <KioskActionButton
                      actionVariant="produce"
                      disabled={pending}
                      onClick={() => onStart?.(subTask.documentId)}
                    >
                      {t("start")}
                    </KioskActionButton>
                  ) : null}
                  {showExit ? (
                    <KioskActionButton
                      actionVariant="outline"
                      onClick={() => setExitingId(subTask.documentId)}
                    >
                      {t("exitSubtask")}
                    </KioskActionButton>
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
                  allowComplete={allowComplete}
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
