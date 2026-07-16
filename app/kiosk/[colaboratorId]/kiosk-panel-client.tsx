"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

import { KioskDailyQueue } from "@/components/kiosk/kiosk-daily-queue";
import {
  formatRemainingWorkerNames,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import { showSuccessToast } from "@/lib/ui/app-toast";

import { exitSubTask, startSubTask } from "./actions";

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

  function handleStart(documentId: string): void {
    startTransition(async () => {
      await startSubTask(colaboratorId, documentId);
      router.refresh();
    });
  }

  function handleExit(documentId: string, input: KioskExitInput): void {
    const subTask = subTasks.find((item) => item.documentId === documentId);
    if (!subTask) return;

    startTransition(async () => {
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
    });
  }

  return (
    <KioskDailyQueue
      subTasks={subTasks}
      readOnly={readOnly}
      pending={pending}
      onStart={readOnly ? undefined : handleStart}
      onExit={readOnly ? undefined : handleExit}
    />
  );
}
