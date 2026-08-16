"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { KioskColaboratorHeader } from "@/components/kiosk/kiosk-colaborator-header";
import { KioskDailyQueue } from "@/components/kiosk/kiosk-daily-queue";
import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import {
  formatRemainingWorkerNames,
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
  readOnly?: boolean;
}

export function KioskPanelClient({
  colaboratorId,
  colaboratorName,
  avatarUrl = null,
  subTasks,
  catalog,
  openRuns,
  readOnly = false,
}: KioskPanelClientProps) {
  const t = useTranslations("kiosk");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flashDocumentId, setFlashDocumentId] = useState<string | null>(null);

  function handleStart(documentId: string): void {
    setFlashDocumentId(documentId);
    window.setTimeout(() => setFlashDocumentId(null), START_FLASH_MS);

    startTransition(async () => {
      await startSubTask(colaboratorId, documentId);
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
    startTransition(async () => {
      try {
        await confirmChainStop(colaboratorId, chainRunId, answers);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("exitFailed"));
      }
    });
  }

  function handleExit(documentId: string, input: KioskExitInput): void {
    const subTask = subTasks.find((item) => item.documentId === documentId);
    if (!subTask) return;

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
      }
    });
  }

  return (
    <div>
      {colaboratorName ? (
        <KioskColaboratorHeader name={colaboratorName} avatarUrl={avatarUrl} />
      ) : null}
      <KioskDailyQueue
        colaboratorId={colaboratorId}
        subTasks={subTasks}
        catalog={catalog}
        openRuns={openRuns}
        readOnly={readOnly}
        pending={pending}
        flashDocumentId={flashDocumentId}
        onStart={readOnly ? undefined : handleStart}
        onExit={readOnly ? undefined : handleExit}
        onStartChain={readOnly ? undefined : handleStartChain}
        onConfirmChainStop={readOnly ? undefined : handleConfirmChainStop}
        onAdvanceChain={readOnly ? undefined : handleAdvanceChain}
      />
    </div>
  );
}
