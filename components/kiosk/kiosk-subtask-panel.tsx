"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type { KioskQueueUnit, OpenChainRun } from "@/lib/business/kiosk-queue-units";
import { queueUnitCursor } from "@/lib/business/kiosk-queue-units";
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
import { KioskExitSubtaskModal } from "./kiosk-exit-subtask-modal";
import { MaterialFlagHintList } from "./material-flag-hint-list";
import { KioskSubtaskEarnedCredits } from "./kiosk-subtask-earned-credits";
import { KioskSubtaskRemainingQtyBadge } from "./kiosk-subtask-remaining-qty-badge";
import { KioskSubtaskProducingMetrics } from "./kiosk-subtask-producing-metrics";
import { KioskSubtaskStatusBadge } from "./kiosk-subtask-status-badge";

export interface KioskSubtaskPanelProps {
  subTasks?: KioskSubTask[];
  units?: KioskQueueUnit[];
  allSubTasks?: KioskSubTask[];
  readOnly?: boolean;
  flashDocumentId?: string | null;
  onStart?: (documentId: string) => void | Promise<void>;
  onExit?: (documentId: string, input: KioskExitInput) => void | Promise<void>;
  onStartChain?: (headId: string) => void | Promise<void>;
  onConfirmChainStop?: (
    chainRunId: string,
    answers: ChainStopAnswer[],
  ) => void | Promise<void>;
  onAdvanceChain?: (chainRunId: string) => void | Promise<void>;
  onReleaseMaterialFlag?: (flagId: string) => void | Promise<void>;
  onRefreshMaterialFlags?: (
    subTaskId: string,
  ) => Promise<{
    flags: Array<{ id: string; code: string }>;
    categoryId: string | null;
    requiresMaterialFlagsOnFinish?: boolean;
  }>;
  onChainRunNotReady?: () => void;
  openRuns?: readonly OpenChainRun[];
  blockingUi?: boolean;
  timerPaused?: boolean;
  exitBusy?: boolean;
  compactFinishedCards?: boolean;
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
  flashDocumentId,
  onStart,
  onExit,
  onStartChain,
  onConfirmChainStop,
  onAdvanceChain,
  onReleaseMaterialFlag,
  onRefreshMaterialFlags,
  onChainRunNotReady,
  openRuns,
  blockingUi = false,
  timerPaused,
  exitBusy = false,
  compactFinishedCards = false,
}: KioskSubtaskPanelProps) {
  const t = useTranslations("kiosk");
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [collectingChainRunId, setCollectingChainRunId] = useState<string | null>(
    null,
  );
  const queueContext = allSubTasks ?? subTasks;
  const resolvedUnits = units ?? unitsFromSubTasks(subTasks);
  const exitingContext = (() => {
    if (!exitingId || !onExit) return null;
    const unit = resolvedUnits.find(
      (item) =>
        item.type === "isolated" && item.subTask.documentId === exitingId,
    );
    if (!unit || unit.type !== "isolated") return null;
    if (unit.subTask.status !== "producing") return null;
    return {
      subTask: unit.subTask,
      helperMode: unit.helperMode,
    };
  })();

  useEffect(() => {
    if (!blockingUi && !exitBusy) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- idle cleanup
      setCollectingChainRunId(null);
    }
  }, [blockingUi, exitBusy]);

  return (
    <>
    <ul className="space-y-3">
      {resolvedUnits.map((unit) => {
        if (unit.type === "group") {
          return (
            <KioskChainGroupCard
              key={`group-${queueUnitCursor(unit)}`}
              unit={unit}
              openRuns={openRuns}
              readOnly={readOnly}
              blockingUi={blockingUi}
              timerPaused={timerPaused}
              exitBusy={exitBusy}
              compactFinishedCards={compactFinishedCards}
              flash={unit.memberIds.includes(flashDocumentId ?? "")}
              collecting={collectingChainRunId === unit.headId}
              onCollectingChange={(next) => {
                setCollectingChainRunId(next ? unit.headId : null);
              }}
              onStartChain={onStartChain}
              onConfirmChainStop={onConfirmChainStop}
              onAdvanceChain={onAdvanceChain}
              onReleaseMaterialFlag={onReleaseMaterialFlag}
              onRefreshMaterialFlags={onRefreshMaterialFlags}
              onChainRunNotReady={onChainRunNotReady}
            />
          );
        }

        const subTask = unit.subTask;
        const helperMode = unit.helperMode;
        const finished = isFinishedSubTask(subTask);
        const locked = isLockedSubTask(subTask);
        const hasOwnSession = Boolean(subTask.startedAt);
        const isProducing = subTask.status === "producing" || hasOwnSession;
        const showLockOverlay = locked;
        const showStart = !readOnly && unit.showStart && !hasOwnSession;
        const showExit =
          !readOnly && shouldShowExitButton(queueContext, subTask);
        const isExiting =
          exitingId === subTask.documentId && isProducing && onExit;
        const isFlashing = flashDocumentId === subTask.documentId;
        const allowComplete = helperMode
          ? false
          : canCompleteSubTaskOnExit(subTask);
        const remainingQty = getRemainingSubTaskQty(
          subTask.targetQty,
          subTask.completedQty,
        );
        const showRemainingQtyBadge =
          !compactFinishedCards &&
          !finished &&
          !isProducing &&
          subTask.sharingType === "qty";

        return (
          <li
            key={subTask.documentId}
            className={cn(
              "relative rounded-2xl border bg-card p-4 transition-colors duration-300",
              finished && "border-muted bg-muted opacity-80",
              isProducing &&
                "border-l-4 border-l-[var(--success)] bg-success/10 shadow-sm",
              showLockOverlay && "bg-muted",
              isFlashing && !isProducing && "bg-muted",
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="min-w-0 space-y-3">
                {subTask.taskName ? (
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {subTask.taskName}
                  </p>
                ) : null}
                <p className="text-lg font-bold leading-snug">{subTask.name}</p>
                {!compactFinishedCards ? (
                  <div className="flex w-full items-center justify-between gap-2">
                    <KioskSubtaskStatusBadge status={subTask.status} />
                    {showRemainingQtyBadge ? (
                      <KioskSubtaskRemainingQtyBadge
                        remainingQty={remainingQty}
                      />
                    ) : null}
                  </div>
                ) : null}
                {isProducing && subTask.startedAt ? (
                  <KioskSubtaskProducingMetrics
                    startedAt={subTask.startedAt}
                    timeSpent={subTask.timeSpent}
                    expectedTime={subTask.expectedTime}
                    timerPaused={timerPaused ?? blockingUi}
                  />
                ) : null}
                {finished && !compactFinishedCards ? (
                  <p className="text-base text-muted-foreground">
                    {t("timeSpent")}:{" "}
                    <span className="tabular-nums">
                      <Duration seconds={subTask.timeSpent} />
                    </span>
                  </p>
                ) : null}
                {finished && compactFinishedCards ? (
                  <KioskSubtaskEarnedCredits
                    amount={subTask.viewerCurrencyAwarded ?? 0}
                  />
                ) : null}
                <MaterialFlagHintList
                  dependencyFlags={subTask.dependencyFlags}
                  assignedFlagCodes={subTask.assignedFlagCodes}
                  onReleaseFlag={
                    !readOnly ? onReleaseMaterialFlag : undefined
                  }
                  canReleaseFlags={isProducing}
                  releaseDisabled={blockingUi}
                />
              </div>
              {!finished && !isExiting ? (
                <div className="flex w-full flex-col gap-2">
                  {showStart ? (
                    <KioskActionButton
                      actionVariant="produce"
                      disabled={blockingUi}
                      onClick={() => onStart?.(subTask.documentId)}
                    >
                      {t("start")}
                    </KioskActionButton>
                  ) : null}
                  {showExit ? (
                    <KioskActionButton
                      actionVariant="outline"
                      disabled={blockingUi}
                      onClick={() => setExitingId(subTask.documentId)}
                    >
                      {t("exitSubtask")}
                    </KioskActionButton>
                  ) : null}
                </div>
              ) : null}
            </div>
            {showLockOverlay ? (
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
          </li>
        );
      })}
    </ul>
    {exitingContext ? (
      <KioskExitSubtaskModal
        open
        title={exitingContext.subTask.name}
        sharingType={exitingContext.subTask.sharingType}
        allowComplete={
          exitingContext.helperMode
            ? false
            : canCompleteSubTaskOnExit(exitingContext.subTask)
        }
        maxQty={
          exitingContext.subTask.sharingType === "qty"
            ? getRemainingSubTaskQty(
                exitingContext.subTask.targetQty,
                exitingContext.subTask.completedQty,
              )
            : undefined
        }
        disabled={blockingUi}
        busy={exitBusy}
        availableFlags={exitingContext.subTask.availableFlags}
        assignedFlagCodes={exitingContext.subTask.assignedFlagCodes}
        subTaskCategoryId={exitingContext.subTask.subTaskCategoryId}
        requiresMaterialFlagsOnFinish={
          exitingContext.subTask.requiresMaterialFlagsOnFinish
        }
        onRefreshFlags={
          onRefreshMaterialFlags
            ? () => onRefreshMaterialFlags(exitingContext.subTask.documentId)
            : undefined
        }
        onClose={() => setExitingId(null)}
        onConfirm={(input) => {
          setExitingId(null);
          onExit?.(exitingContext.subTask.documentId, input);
        }}
      />
    ) : null}
    </>
  );
}
