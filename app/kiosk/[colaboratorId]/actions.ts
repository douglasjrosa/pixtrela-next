"use server";

import { revalidateTag } from "next/cache";

import { KIOSK_ACTION_ERROR_CODES } from "@/lib/business/kiosk-action-error";
import type { KioskQueueSectionKey } from "@/lib/business/kiosk-queue-units";
import { getRemainingSubTaskQty } from "@/lib/business/subtask-queue";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";
import {
  assertQueueReader,
  assertQueueStaffMutation,
} from "@/lib/kiosk/queue-staff-access";
import {
  startChain as startChainRepo,
  advanceChainRun as advanceChainRunRepo,
  confirmChainStop as confirmChainStopRepo,
  joinLiveChain as joinLiveChainRepo,
} from "@/lib/repos/kiosk-chains";
import {
  listKioskQueueSectionPage,
  listKioskQueueSnapshot,
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
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { findUserFacePhotoUrl } from "@/lib/repos/users";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

function invalidateActivityData(): void {
  revalidateTag("drizzle:activities", "default");
  revalidateTag("drizzle:subTasks", "default");
  revalidateTag("drizzle:balances", "default");
  revalidateTag("drizzle:tasks", "default");
}

export type KioskMutationResult = { errorCode?: string };

function refusalResult(error: unknown): KioskMutationResult | null {
  if (!(error instanceof Error)) return null;
  const code = error.message;
  if ((KIOSK_ACTION_ERROR_CODES as readonly string[]).includes(code)) {
    return { errorCode: code };
  }
  return null;
}

async function runKioskMutation(
  action: () => Promise<void>,
): Promise<KioskMutationResult> {
  try {
    await action();
    invalidateActivityData();
    return {};
  } catch (error) {
    const refusal = refusalResult(error);
    if (refusal) return refusal;
    throw error;
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
  staffUserId?: string;
}): Promise<KioskQueueSectionPage> {
  await assertQueueReader(input.colaboratorId, input.staffUserId);
  if (!SECTION_KEYS.has(input.section)) {
    throw new Error("invalidSection");
  }
  if (!input.colaboratorId.trim()) {
    throw new Error("forbidden");
  }
  const settings = await loadKioskSettings();
  return listKioskQueueSectionPage({
    colaboratorId: input.colaboratorId,
    section: input.section,
    cursor: input.cursor,
    liveChainIntervalSeconds: settings.maxSimultaneousSubtaskIntervalSeconds,
    queuePageSize: settings.queuePageSize,
    catalogMode: "slim",
  });
}

export async function fetchKioskQueueSnapshot(input: {
  colaboratorId: string;
  sections: KioskQueueSectionKey[];
  staffUserId?: string;
}): Promise<KioskQueueSectionPage[]> {
  await assertQueueReader(input.colaboratorId, input.staffUserId);
  if (!input.colaboratorId.trim()) throw new Error("forbidden");
  const sections = input.sections.filter((section) => SECTION_KEYS.has(section));
  if (sections.length === 0) throw new Error("invalidSection");
  const settings = await loadKioskSettings();
  return listKioskQueueSnapshot({
    colaboratorId: input.colaboratorId,
    sections,
    liveChainIntervalSeconds: settings.maxSimultaneousSubtaskIntervalSeconds,
    queuePageSize: settings.queuePageSize,
    catalogMode: "slim",
  });
}

export async function startSubTask(
  colaboratorId: string,
  subTaskDocumentId: string,
  staffUserId?: string,
): Promise<KioskMutationResult> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);
  activityFormSchema.parse({
    subTaskDocumentId,
    action: "started",
  });
  return runKioskMutation(() => startSubTaskRepo(colaboratorId, subTaskDocumentId));
}

export async function exitSubTask(
  colaboratorId: string,
  subTaskDocumentId: string,
  sharingType: SubTaskFormInput["sharingType"],
  rawExit: unknown,
  targetQty?: number,
  completedQty = 0,
  staffUserId?: string,
): Promise<{ remainingWorkerNames: string[] }> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);

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
  staffUserId?: string,
): Promise<KioskMutationResult> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);
  return runKioskMutation(() => startChainRepo(colaboratorId, headId));
}

export async function joinLiveChain(
  colaboratorId: string,
  subTaskDocumentId: string,
  staffUserId?: string,
): Promise<KioskMutationResult> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);
  return runKioskMutation(() =>
    joinLiveChainRepo(colaboratorId, subTaskDocumentId),
  );
}

export async function advanceChainRun(
  colaboratorId: string,
  chainRunId: string,
  staffUserId?: string,
): Promise<void> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);
  await advanceChainRunRepo(chainRunId);
  invalidateActivityData();
}

export async function confirmChainStop(
  colaboratorId: string,
  chainRunId: string | null,
  rawAnswers: unknown,
  staffUserId?: string,
  headId?: string,
): Promise<KioskMutationResult> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);
  const answers = parseChainStopAnswers(rawAnswers);
  return runKioskMutation(() =>
    confirmChainStopRepo(
      colaboratorId,
      chainRunId,
      answers,
      undefined,
      undefined,
      headId,
    ),
  );
}

export async function fetchColaboratorFacePhotoUrl(
  colaboratorId: string,
  staffUserId?: string,
): Promise<string | null> {
  await assertQueueReader(colaboratorId, staffUserId);
  const url = await findUserFacePhotoUrl(colaboratorId);
  return toBrowserMediaUrl(url);
}

export async function refreshMaterialFlags(
  subTaskDocumentId: string,
  colaboratorId: string,
  staffUserId?: string,
): Promise<{
  categoryId: string | null;
  flags: Array<{ id: string; code: string }>;
  requiresMaterialFlagsOnFinish: boolean;
}> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);
  const result = await refreshKioskMaterialFlags(subTaskDocumentId);
  invalidateActivityData();
  return result;
}

/** Release one material flag (consumer frees a predecessor flag). */
export async function releaseMaterialFlag(
  flagId: string,
  colaboratorId: string,
  staffUserId?: string,
): Promise<void> {
  await assertQueueStaffMutation(colaboratorId, staffUserId);
  await releaseMaterialFlagRepo(flagId);
  invalidateActivityData();
}
