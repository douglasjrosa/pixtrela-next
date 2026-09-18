"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import type { KioskGroupUnit } from "@/lib/business/kiosk-queue-units";
import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import { resolvePersistedChainRunId } from "@/lib/business/kiosk-optimistic-start";
import {
  buildInitialChainStopAnswers,
  type ChainStopAnswer,
} from "@/lib/business/subtask-chain-allocation";
import { Duration } from "@/components/ui/duration";
import { cn } from "@/lib/utils";

import { KioskActionButton } from "./kiosk-action-button";
import { KioskChainAdvanceTimer } from "./kiosk-chain-advance-timer";
import { KioskChainExitWizardModal } from "./kiosk-chain-exit-wizard-modal";
import { MaterialFlagHintList } from "./material-flag-hint-list";
import { KioskSubtaskEarnedCredits } from "./kiosk-subtask-earned-credits";
import { KioskSubtaskProducingMetrics } from "./kiosk-subtask-producing-metrics";
import { KioskSubtaskStatusBadge } from "./kiosk-subtask-status-badge";

export interface KioskChainGroupCardProps {
  unit: KioskGroupUnit;
  openRuns?: readonly OpenChainRun[];
  readOnly?: boolean;
  blockingUi?: boolean;
  timerPaused?: boolean;
  exitBusy?: boolean;
  compactFinishedCards?: boolean;
  flash?: boolean;
  collecting?: boolean;
  onCollectingChange?: (collecting: boolean) => void;
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
}

export function KioskChainGroupCard({
  unit,
  openRuns,
  readOnly = false,
  blockingUi = false,
  timerPaused,
  exitBusy = false,
  compactFinishedCards = false,
  flash,
  collecting: collectingProp,
  onCollectingChange,
  onStartChain,
  onConfirmChainStop,
  onAdvanceChain,
  onReleaseMaterialFlag,
  onRefreshMaterialFlags,
  onChainRunNotReady,
}: KioskChainGroupCardProps) {
  const t = useTranslations("kiosk");
  const [collectingInternal, setCollectingInternal] = useState(false);
  const collecting = collectingProp ?? collectingInternal;
  const [chainStepIndex, setChainStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ChainStopAnswer>>({});

  function setCollecting(next: boolean): void {
    if (onCollectingChange) {
      onCollectingChange(next);
      return;
    }
    setCollectingInternal(next);
  }

  const taskName = unit.members[0]?.taskName;
  const showLockOverlay = unit.locked && !unit.principalActive;
  const showStart = !readOnly && unit.showStart;
  const showStop =
    !readOnly && unit.principalActive && !collecting;
  const persistedChainRunId = resolvePersistedChainRunId(
    unit.chainRunId,
    openRuns,
    unit.headId,
  );
  function resetCollecting(): void {
    setCollecting(false);
    setChainStepIndex(0);
    setAnswers({});
  }

  function handleStopClick(): void {
    setAnswers(buildInitialChainStopAnswers(unit.members));
    setChainStepIndex(0);
    setCollecting(true);
  }

  function handleConfirmStop(): void {
    if (blockingUi) return;
    if (!persistedChainRunId) {
      onChainRunNotReady?.();
      return;
    }
    const payload = unit.members.map((member) => {
      const answer =
        answers[member.documentId] ?? { documentId: member.documentId };
      return {
        documentId: answer.documentId,
        ...(typeof answer.completed === "boolean"
          ? { completed: answer.completed }
          : {}),
        ...(typeof answer.qty === "number" ? { qty: answer.qty } : {}),
        ...(answer.flagIds && answer.flagIds.length > 0
          ? { flagIds: answer.flagIds }
          : {}),
      };
    });
    resetCollecting();
    onConfirmChainStop?.(persistedChainRunId, payload);
  }

  return (
    <li
      data-testid="kiosk-chain-group"
      className={cn(
        "relative rounded-2xl border bg-card p-4 transition-colors duration-300",
        unit.principalActive &&
          "border-l-4 border-l-[var(--success)] bg-success/10 shadow-sm",
        showLockOverlay && "bg-muted",
        flash && !unit.principalActive && "bg-muted",
      )}
    >
      <div className="flex flex-col gap-4">
        {taskName ? (
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {taskName}
          </p>
        ) : null}
        <ul className="space-y-3">
          {unit.members.map((member) => {
            const isProducing =
              member.status === "producing" || Boolean(member.startedAt);
            return (
              <li
                key={member.documentId}
                data-testid={`kiosk-chain-member-${member.documentId}`}
                className="min-w-0 space-y-3 rounded-xl border bg-background p-3"
              >
                <p className="text-lg font-bold leading-snug">{member.name}</p>
                <MaterialFlagHintList
                  dependencyFlags={member.dependencyFlags}
                  assignedFlagCodes={member.assignedFlagCodes}
                  onReleaseFlag={
                    !readOnly ? onReleaseMaterialFlag : undefined
                  }
                  canReleaseFlags={isProducing}
                  releaseDisabled={blockingUi}
                />
                {!compactFinishedCards ? (
                  <KioskSubtaskStatusBadge status={member.status} />
                ) : null}
                {isProducing && member.startedAt ? (
                  <KioskSubtaskProducingMetrics
                    startedAt={member.startedAt}
                    timeSpent={member.timeSpent}
                    expectedTime={member.expectedTime}
                    timerPaused={timerPaused ?? blockingUi}
                  />
                ) : null}
                {member.status === "finished" && !compactFinishedCards ? (
                  <p className="text-base text-muted-foreground">
                    {t("timeSpent")}:{" "}
                    <span className="tabular-nums">
                      <Duration seconds={member.timeSpent} />
                    </span>
                  </p>
                ) : null}
                {member.status === "finished" && compactFinishedCards ? (
                  <KioskSubtaskEarnedCredits
                    amount={member.viewerCurrencyAwarded ?? 0}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
        {!readOnly && (showStart || showStop) ? (
          <div className="flex w-full flex-col gap-2">
            {showStart ? (
              <KioskActionButton
                actionVariant="produce"
                disabled={blockingUi}
                onClick={() => onStartChain?.(unit.headId)}
              >
                {t("start")}
              </KioskActionButton>
            ) : null}
            {showStop ? (
              <KioskActionButton
                actionVariant="outline"
                disabled={blockingUi}
                onClick={handleStopClick}
              >
                {t("stop")}
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
      {persistedChainRunId && unit.runStartedAt && onAdvanceChain ? (
        <KioskChainAdvanceTimer
          chainRunId={persistedChainRunId}
          runStartedAt={unit.runStartedAt}
          members={unit.members}
          onAdvance={onAdvanceChain}
        />
      ) : null}
      {collecting ? (
        <KioskChainExitWizardModal
          open
          members={unit.members}
          stepIndex={chainStepIndex}
          answers={answers}
          disabled={blockingUi}
          busy={exitBusy}
          onStepChange={setChainStepIndex}
          onAnswerChange={(documentId, answer) =>
            setAnswers((current) => ({
              ...current,
              [documentId]: answer,
            }))
          }
          onConfirm={handleConfirmStop}
          onCancel={resetCollecting}
          onRefreshFlags={onRefreshMaterialFlags}
        />
      ) : null}
    </li>
  );
}
