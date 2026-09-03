"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { KioskQueueSectionKey } from "@/lib/business/kiosk-queue-units";
import { getRemainingSubTaskQty } from "@/lib/business/subtask-queue";
import { loadKioskLiveChainIntervalSeconds } from "@/lib/kiosk/load-session-idle";
import {
  startChain as startChainRepo,
  advanceChainRun as advanceChainRunRepo,
  confirmChainStop as confirmChainStopRepo,
  joinLiveChain as joinLiveChainRepo,
} from "@/lib/repos/kiosk-chains";
import {
  listKioskQueueSectionPage,
  startSubTask as startSubTaskRepo,
  stopSubTask as stopSubTaskRepo,
  type KioskQueueSectionPage,
} from "@/lib/repos/kiosk-subtasks";
import {
  refreshKioskMaterialFlags,
  releaseMaterialFlag as releaseMaterialFlagRepo,
} from "@/lib/repos/material-flags";
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

const SECTION_KEYS = new Set<KioskQueueSectionKey>([
  "liberadas",
  "bloqueadas",
  "finalizadas_hoje",
]);

export async function fetchKioskQueueSectionPage(input: {
  colaboratorId: string;
  section: KioskQueueSectionKey;
  cursor?: string | null;
}): Promise<KioskQueueSectionPage> {
  await assertKioskSession();
  if (!SECTION_KEYS.has(input.section)) {
    throw new Error("invalidSection");
  }
  if (!input.colaboratorId.trim()) {
    throw new Error("forbidden");
  }
  const liveChainIntervalSeconds = await loadKioskLiveChainIntervalSeconds();
  return listKioskQueueSectionPage({
    colaboratorId: input.colaboratorId,
    section: input.section,
    cursor: input.cursor,
    liveChainIntervalSeconds,
  });
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

export async function refreshMaterialFlags(subTaskDocumentId: string): Promise<{
  categoryId: string | null;
  flags: Array<{ id: string; code: string }>;
  requiresMaterialFlagsOnFinish: boolean;
}> {
  await assertKioskSession();
  const result = await refreshKioskMaterialFlags(subTaskDocumentId);
  invalidateActivityData();
  return result;
}

/** Release one material flag (consumer frees a predecessor flag). */
export async function releaseMaterialFlag(flagId: string): Promise<void> {
  await assertKioskSession();
  await releaseMaterialFlagRepo(flagId);
  invalidateActivityData();
}
