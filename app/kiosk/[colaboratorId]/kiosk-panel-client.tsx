"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { KioskColaboratorHeader } from "@/components/kiosk/kiosk-colaborator-header";
import { KioskDailyQueue } from "@/components/kiosk/kiosk-daily-queue";
import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import {
  applyOptimisticKioskStartToOpenRuns,
  applyOptimisticKioskStartToSubTasks,
  isOptimisticKioskStartSettled,
  type OptimisticKioskStart,
} from "@/lib/business/kiosk-optimistic-start";
import {
  formatRemainingWorkerNames,
  hasActiveSubTask,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import { buildKioskQueueFingerprint } from "@/lib/kiosk/queue-fingerprint";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { markKioskColaboratorReady } from "@/lib/welcome/kiosk-welcome-ready";

import {
  advanceChainRun,
  confirmChainStop,
  exitSubTask,
  joinLiveChain,
  releaseSubTaskFlags,
  startChain,
  startSubTask,
} from "./actions";

const START_FLASH_MS = 300;

function kioskActionErrorMessage(
  t: (key: string) => string,
  error: unknown,
): string {
  const code = error instanceof Error ? error.message : "";
  if (code === "flagsRequired") return t("flagsRequired");
  if (code === "subTaskHasNoCategory") return t("subTaskHasNoCategory");
  if (code === "flagOccupied") return t("flagOccupied");
  return t("exitFailed");
}

export interface KioskPanelClientProps {
  colaboratorId: string;
  colaboratorName: string;
  avatarUrl?: string | null;
  subTasks: KioskSubTask[];
  catalog?: KioskSubTask[];
  openRuns?: OpenChainRun[];
  maxSimultaneousSubtaskIntervalSeconds?: number;
  readOnly?: boolean;
}

export function KioskPanelClient({
  colaboratorId,
  colaboratorName,
  avatarUrl = null,
  subTasks,
  catalog,
  openRuns,
  maxSimultaneousSubtaskIntervalSeconds = 0,
  readOnly = false,
}: KioskPanelClientProps) {
  const t = useTranslations("kiosk");
  const router = useRouter();
  const [queueBusy, setQueueBusy] = useState<"start" | "exit" | null>(null);
  const [optimisticStart, setOptimisticStart] =
    useState<OptimisticKioskStart | null>(null);
  const [flashDocumentId, setFlashDocumentId] = useState<string | null>(null);
  const exitFingerprintRef = useRef<string | null>(null);

  const displaySubTasks = applyOptimisticKioskStartToSubTasks(
    subTasks,
    optimisticStart,
  );
  const displayCatalog = applyOptimisticKioskStartToSubTasks(
    catalog ?? subTasks,
    optimisticStart,
  );
  const displayOpenRuns = applyOptimisticKioskStartToOpenRuns(
    openRuns,
    optimisticStart,
    colaboratorId,
  );

  if (
    optimisticStart &&
    isOptimisticKioskStartSettled(subTasks, optimisticStart)
  ) {
    setOptimisticStart(null);
    setQueueBusy((current) => (current === "start" ? null : current));
  }

  useEffect(() => {
    markKioskColaboratorReady();
  }, []);

  useEffect(() => {
    if (queueBusy !== "exit" || exitFingerprintRef.current === null) return;
    const nextFingerprint = buildKioskQueueFingerprint(subTasks, openRuns);
    if (nextFingerprint !== exitFingerprintRef.current) {
      exitFingerprintRef.current = null;
      setQueueBusy(null);
    }
  }, [openRuns, queueBusy, subTasks]);

  const runBackgroundAction = useCallback(
    (action: () => Promise<void>, onError?: (error: unknown) => void): void => {
      void (async () => {
        try {
          await action();
          router.refresh();
        } catch (error) {
          rethrowIfNavigationError(error);
          setOptimisticStart(null);
          setQueueBusy(null);
          exitFingerprintRef.current = null;
          onError?.(error);
        }
      })();
    },
    [router],
  );

  function handleStart(documentId: string): void {
    if (queueBusy) return;
    setFlashDocumentId(documentId);
    window.setTimeout(() => setFlashDocumentId(null), START_FLASH_MS);
    const startedAt = new Date().toISOString();
    const mode = hasActiveSubTask(subTasks) ? "join" : "solo";
    setOptimisticStart({ documentId, startedAt, mode });
    setQueueBusy("start");
    runBackgroundAction(async () => {
      if (mode === "join") {
        await joinLiveChain(colaboratorId, documentId);
      } else {
        await startSubTask(colaboratorId, documentId);
      }
    }, () => {
      showErrorToast(t("startFailed"));
    });
  }

  function handleStartChain(headId: string): void {
    if (queueBusy) return;
    setFlashDocumentId(headId);
    window.setTimeout(() => setFlashDocumentId(null), START_FLASH_MS);
    const startedAt = new Date().toISOString();
    setOptimisticStart({
      documentId: headId,
      startedAt,
      mode: "chain",
      chainHeadId: headId,
    });
    setQueueBusy("start");
    runBackgroundAction(async () => {
      await startChain(colaboratorId, headId);
    }, () => {
      showErrorToast(t("startFailed"));
    });
  }

  const handleAdvanceChain = useCallback(
    (chainRunId: string): void => {
      if (queueBusy) return;
      exitFingerprintRef.current = buildKioskQueueFingerprint(
        subTasks,
        openRuns,
      );
      setQueueBusy("exit");
      runBackgroundAction(async () => {
        await advanceChainRun(chainRunId);
      }, () => {
        showErrorToast(t("exitFailed"));
      });
    },
    [openRuns, queueBusy, runBackgroundAction, subTasks, t],
  );

  function handleConfirmChainStop(
    chainRunId: string,
    answers: ChainStopAnswer[],
  ): void {
    if (queueBusy) return;
    exitFingerprintRef.current = buildKioskQueueFingerprint(
      subTasks,
      openRuns,
    );
    setQueueBusy("exit");
    runBackgroundAction(async () => {
      await confirmChainStop(colaboratorId, chainRunId, answers);
    }, (error) => {
      showErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  function handleExit(documentId: string, input: KioskExitInput): void {
    const subTask = displaySubTasks.find(
      (item) => item.documentId === documentId,
    );
    if (!subTask || queueBusy) return;

    exitFingerprintRef.current = buildKioskQueueFingerprint(
      subTasks,
      openRuns,
    );
    setQueueBusy("exit");
    runBackgroundAction(async () => {
      const result = await exitSubTask(
        colaboratorId,
        documentId,
        subTask.sharingType,
        input,
        subTask.targetQty,
        subTask.completedQty,
      );
      const names = formatRemainingWorkerNames(result.remainingWorkerNames);
      if (names) {
        showSuccessToast(t("exitOthersStillActive", { name: names }));
        return;
      }
      showSuccessToast(t("exitRecorded"));
    }, (error) => {
      showErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  function handleReleaseFlags(documentId: string): void {
    if (queueBusy) return;
    setQueueBusy("exit");
    runBackgroundAction(async () => {
      await releaseSubTaskFlags(documentId);
      showSuccessToast(t("flagsReleased"));
      setQueueBusy(null);
    }, (error) => {
      showErrorToast(kioskActionErrorMessage(t, error));
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {colaboratorName ? (
        <KioskColaboratorHeader
          name={colaboratorName}
          avatarUrl={avatarUrl}
          className="sticky top-0 z-30 shrink-0 bg-background/95 backdrop-blur-sm"
        />
      ) : null}
      <div className="relative min-h-0 flex-1">
        <KioskDailyQueue
          colaboratorId={colaboratorId}
          subTasks={displaySubTasks}
          catalog={displayCatalog}
          openRuns={displayOpenRuns}
          maxSimultaneousSubtaskIntervalSeconds={
            maxSimultaneousSubtaskIntervalSeconds
          }
          readOnly={readOnly}
          blockingUi={queueBusy !== null}
          timerPaused={queueBusy === "exit"}
          exitBusy={queueBusy === "exit"}
          flashDocumentId={flashDocumentId}
          onStart={readOnly ? undefined : handleStart}
          onExit={readOnly ? undefined : handleExit}
          onStartChain={readOnly ? undefined : handleStartChain}
          onConfirmChainStop={readOnly ? undefined : handleConfirmChainStop}
          onAdvanceChain={readOnly ? undefined : handleAdvanceChain}
          onReleaseFlags={readOnly ? undefined : handleReleaseFlags}
        />
      </div>
    </div>
  );
}
