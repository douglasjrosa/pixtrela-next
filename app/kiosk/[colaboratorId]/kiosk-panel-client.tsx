"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { KioskDailyQueue } from "@/components/kiosk/kiosk-daily-queue";
import {
  formatRemainingWorkerNames,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";

import { exitSubTask, startSubTask } from "./actions";

const START_FLASH_MS = 300;

export interface KioskPanelClientProps {
  colaboratorId: string;
  subTasks: KioskSubTask[];
  readOnly?: boolean;
}

export function KioskPanelClient({
  colaboratorId,
  subTasks,
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
    <KioskDailyQueue
      subTasks={subTasks}
      readOnly={readOnly}
      pending={pending}
      flashDocumentId={flashDocumentId}
      onStart={readOnly ? undefined : handleStart}
      onExit={readOnly ? undefined : handleExit}
    />
  );
}
