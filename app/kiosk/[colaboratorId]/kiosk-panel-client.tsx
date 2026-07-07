"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { KioskSubtaskPanel } from "@/components/kiosk/kiosk-subtask-panel";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

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
      await exitSubTask(
        colaboratorId,
        documentId,
        subTask.sharingType,
        input,
        subTask.qty,
        subTask.completedQty,
      );
      router.refresh();
    });
  }

  return (
    <KioskSubtaskPanel
      subTasks={subTasks}
      readOnly={readOnly}
      pending={pending}
      onStart={readOnly ? undefined : handleStart}
      onExit={readOnly ? undefined : handleExit}
    />
  );
}
