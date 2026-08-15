"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { activities, users } from "@/drizzle/schema";
import { getRemainingSubTaskQty } from "@/lib/business/subtask-queue";
import {
  listOpenColaboratorDocumentIds,
  type ActivitySessionRef,
} from "@/lib/business/task-progress";
import { getDb } from "@/lib/db/client";
import { activityFormSchema } from "@/lib/schemas/activity";
import {
  parseKioskExitInput,
  toActivityStopPayload,
  type KioskExitInput,
} from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import { recordActivity } from "@/lib/repos/tasks";

function invalidateActivityData(): void {
  revalidateTag("drizzle:activities", "default");
  revalidateTag("drizzle:tasks", "default");
  revalidateTag("drizzle:balances", "default");
}

async function assertKioskSession(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    throw new Error("forbidden");
  }
}

async function loadActivityRefs(
  subTaskDocumentId: string,
): Promise<ActivitySessionRef[]> {
  const db = getDb();
  const activityRows = await db
    .select({
      action: activities.action,
      timestamp: activities.timestamp,
      qty: activities.qty,
      colaboratorId: activities.colaboratorId,
      colaboratorName: users.name,
    })
    .from(activities)
    .innerJoin(users, eq(activities.colaboratorId, users.id))
    .where(
      and(
        eq(activities.subTaskId, subTaskDocumentId),
        inArray(activities.action, ["started", "stoped"]),
      ),
    )
    .orderBy(asc(activities.timestamp));

  return activityRows.flatMap((row) => {
    if (!row.timestamp) return [];
    return [
      {
        subTaskDocumentId,
        colaboratorDocumentId: row.colaboratorId,
        colaboratorName: row.colaboratorName ?? "",
        action: row.action as "started" | "stoped",
        timestamp: row.timestamp.toISOString(),
        qty: Number(row.qty ?? 0),
      },
    ];
  });
}

async function remainingWorkerNames(
  subTaskDocumentId: string,
  excludeColaboratorId: string,
): Promise<string[]> {
  const refs = await loadActivityRefs(subTaskDocumentId);
  const openIds = listOpenColaboratorDocumentIds(refs).filter(
    (id) => id !== excludeColaboratorId,
  );
  const nameById = new Map(
    refs.map((ref) => [ref.colaboratorDocumentId, ref.colaboratorName ?? ""]),
  );
  return openIds.map((id) => nameById.get(id) ?? "").filter(Boolean);
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

  await recordActivity({
    subTaskId: subTaskDocumentId,
    colaboratorId,
    action: "started",
  });

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

  await recordActivity({
    subTaskId: subTaskDocumentId,
    colaboratorId,
    action: "stoped",
    qty: stopPayload.qty,
  });

  const names = await remainingWorkerNames(subTaskDocumentId, colaboratorId);
  invalidateActivityData();
  return { remainingWorkerNames: names };
}
