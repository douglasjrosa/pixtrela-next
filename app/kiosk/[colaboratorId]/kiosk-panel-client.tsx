"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { KioskBlockingOverlay } from "@/components/kiosk/kiosk-blocking-overlay";
import { KioskColaboratorHeader } from "@/components/kiosk/kiosk-colaborator-header";
import { KioskDailyQueue } from "@/components/kiosk/kiosk-daily-queue";
import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import {
  formatRemainingWorkerNames,
  hasActiveSubTask,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

import {
  advanceChainRun,
  confirmChainStop,
  exitSubTask,
  joinLiveChain,
  startChain,
  startSubTask,
} from "./actions";

const START_FLASH_MS = 300;

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
  const [pending, startTransition] = useTransition();
  const [blockingUi, setBlockingUi] = useState(false);
  const [flashDocumentId, setFlashDocumentId] = useState<string | null>(null);

  function handleStart(documentId: string): void {
    setFlashDocumentId(documentId);
    window.setTimeout(() => setFlashDocumentId(null), START_FLASH_MS);

    startTransition(async () => {
      if (hasActiveSubTask(subTasks)) {
        await joinLiveChain(colaboratorId, documentId);
      } else {
        await startSubTask(colaboratorId, documentId);
      }
      router.refresh();
    });
  }

  function handleStartChain(headId: string): void {
    setFlashDocumentId(headId);
    window.setTimeout(() => setFlashDocumentId(null), START_FLASH_MS);

    startTransition(async () => {
      await startChain(colaboratorId, headId);
      router.refresh();
    });
  }

  const handleAdvanceChain = useCallback(
    (chainRunId: string): void => {
      startTransition(async () => {
        await advanceChainRun(chainRunId);
        router.refresh();
      });
    },
    [router],
  );

  function handleConfirmChainStop(
    chainRunId: string,
    answers: ChainStopAnswer[],
  ): void {
    setBlockingUi(true);
    startTransition(async () => {
      try {
        await confirmChainStop(colaboratorId, chainRunId, answers);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("exitFailed"));
      } finally {
        setBlockingUi(false);
      }
    });
  }

  function handleExit(documentId: string, input: KioskExitInput): void {
    const subTask = subTasks.find((item) => item.documentId === documentId);
    if (!subTask) return;

    setBlockingUi(true);
    startTransition(async () => {
      try {
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
        }
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("exitFailed"));
      } finally {
        setBlockingUi(false);
      }
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
        <div
          className={blockingUi ? "pointer-events-none select-none" : undefined}
          {...(blockingUi ? { inert: true } : {})}
        >
          <KioskDailyQueue
            colaboratorId={colaboratorId}
            subTasks={subTasks}
            catalog={catalog}
            openRuns={openRuns}
            maxSimultaneousSubtaskIntervalSeconds={
              maxSimultaneousSubtaskIntervalSeconds
            }
            readOnly={readOnly}
            pending={pending}
            blockingUi={blockingUi}
            flashDocumentId={flashDocumentId}
            onStart={readOnly ? undefined : handleStart}
            onExit={readOnly ? undefined : handleExit}
            onStartChain={readOnly ? undefined : handleStartChain}
            onConfirmChainStop={readOnly ? undefined : handleConfirmChainStop}
            onAdvanceChain={readOnly ? undefined : handleAdvanceChain}
          />
        </div>
        {blockingUi ? <KioskBlockingOverlay /> : null}
      </div>
    </div>
  );
}
