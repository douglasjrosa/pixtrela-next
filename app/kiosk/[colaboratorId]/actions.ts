"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { getRemainingSubTaskQty } from "@/lib/business/subtask-queue";
import {
  startChain as startChainRepo,
  advanceChainRun as advanceChainRunRepo,
  confirmChainStop as confirmChainStopRepo,
  joinLiveChain as joinLiveChainRepo,
} from "@/lib/repos/kiosk-chains";
import {
  startSubTask as startSubTaskRepo,
  stopSubTask as stopSubTaskRepo,
} from "@/lib/repos/kiosk-subtasks";
import { releaseFlagsForSubTask as releaseFlagsForSubTaskRepo } from "@/lib/repos/material-flags";
import { getSubTaskById } from "@/lib/repos/tasks";
import { runTaskSubTaskSyncRoutine } from "@/lib/repos/subtask-lifecycle";
import { activityFormSchema } from "@/lib/schemas/activity";
import { parseChainStopAnswers } from "@/lib/schemas/kiosk-chain-stop";
import {
  parseKioskExitInput,
  toActivityStopPayload,
  type KioskExitInput,
} from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

function invalidateActivityData(): void {
  revalidateTag("drizzle:activities", "default");
  revalidateTag("drizzle:subTasks", "default");
  revalidateTag("drizzle:balances", "default");
  revalidateTag("drizzle:tasks", "default");
}

async function assertKioskSession(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    throw new Error("forbidden");
  }
}

export async function startSubTask(
  colaboratorId: string,
  subTaskDocumentId: string,
): Promise<void> {
  await assertKioskSession();

  activityFormSchema.parse({
    subTaskDocumentId,
    action: "started",
  });

  await startSubTaskRepo(colaboratorId, subTaskDocumentId);
  invalidateActivityData();
}

export async function exitSubTask(
  colaboratorId: string,
  subTaskDocumentId: string,
  sharingType: SubTaskFormInput["sharingType"],
  rawExit: unknown,
  targetQty?: number,
  completedQty = 0,
): Promise<{ remainingWorkerNames: string[] }> {
  await assertKioskSession();

  const exitInput: KioskExitInput = parseKioskExitInput(sharingType, rawExit, {
    maxQty:
      sharingType === "qty" && targetQty !== undefined
        ? getRemainingSubTaskQty(targetQty, completedQty)
        : undefined,
  });
  const stopPayload = toActivityStopPayload(exitInput);

  activityFormSchema.parse({
    subTaskDocumentId,
    action: "stoped",
    ...stopPayload,
  });

  const result = await stopSubTaskRepo(
    colaboratorId,
    subTaskDocumentId,
    stopPayload,
  );
  invalidateActivityData();
  return { remainingWorkerNames: result.remainingWorkerNames };
}

export async function startChain(
  colaboratorId: string,
  headId: string,
): Promise<void> {
  await assertKioskSession();
  await startChainRepo(colaboratorId, headId);
  invalidateActivityData();
}

export async function joinLiveChain(
  colaboratorId: string,
  subTaskDocumentId: string,
): Promise<void> {
  await assertKioskSession();
  await joinLiveChainRepo(colaboratorId, subTaskDocumentId);
  invalidateActivityData();
}

export async function advanceChainRun(chainRunId: string): Promise<void> {
  await assertKioskSession();
  await advanceChainRunRepo(chainRunId);
  invalidateActivityData();
}

export async function confirmChainStop(
  colaboratorId: string,
  chainRunId: string,
  rawAnswers: unknown,
): Promise<void> {
  await assertKioskSession();
  const answers = parseChainStopAnswers(rawAnswers);
  await confirmChainStopRepo(colaboratorId, chainRunId, answers);
  invalidateActivityData();
}

export async function releaseSubTaskFlags(
  subTaskDocumentId: string,
): Promise<void> {
  await assertKioskSession();
  await releaseFlagsForSubTaskRepo(subTaskDocumentId);
  const subtask = await getSubTaskById(subTaskDocumentId);
  if (subtask) {
    await runTaskSubTaskSyncRoutine(subtask.taskId);
  }
  invalidateActivityData();
}
