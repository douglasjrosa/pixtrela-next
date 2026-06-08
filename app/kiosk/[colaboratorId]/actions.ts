"use server";

import { auth } from "@/auth";
import { getRemainingSubTaskQty } from "@/lib/business/subtask-queue";
import { activityFormSchema } from "@/lib/schemas/activity";
import {
  parseKioskExitInput,
  toActivityStopPayload,
  type KioskExitInput,
} from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

function invalidateActivityData(): void {
  revalidateStrapiTags(
    STRAPI_TAGS.activities,
    STRAPI_TAGS.subTasks,
    STRAPI_TAGS.balance,
  );
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

  await strapiFetch(
    `/kiosk/colaborators/${colaboratorId}/sub-tasks/${subTaskDocumentId}/start`,
    { method: "POST", strapiCache: { noStore: true } },
  );

  invalidateActivityData();
}

export async function exitSubTask(
  colaboratorId: string,
  subTaskDocumentId: string,
  sharingType: SubTaskFormInput["sharingType"],
  rawExit: unknown,
  subTaskQty?: number,
  completedQty = 0,
): Promise<void> {
  await assertKioskSession();

  const exitInput: KioskExitInput = parseKioskExitInput(sharingType, rawExit, {
    maxQty:
      sharingType === "qty" && subTaskQty !== undefined
        ? getRemainingSubTaskQty(subTaskQty, completedQty)
        : undefined,
  });
  const stopPayload = toActivityStopPayload(exitInput);

  activityFormSchema.parse({
    subTaskDocumentId,
    action: "stoped",
    ...stopPayload,
  });

  await strapiFetch(
    `/kiosk/colaborators/${colaboratorId}/sub-tasks/${subTaskDocumentId}/stop`,
    {
      method: "POST",
      strapiCache: { noStore: true },
      body: JSON.stringify({ data: stopPayload }),
    },
  );

  invalidateActivityData();
}
