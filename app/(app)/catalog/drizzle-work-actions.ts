"use server";

import { revalidateTag } from "next/cache";

import { isDrizzleBackend } from "@/lib/db/backend";
import {
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import { redeemAward } from "@/lib/repos/exchanges";
import {
  identifyColaboratorByCode,
  identifyColaboratorByFace,
  identifyColaboratorByTag,
} from "@/lib/repos/kiosk";
import {
  createTask,
  listSubTasksForTask,
  listTasks,
  recordActivity,
} from "@/lib/repos/tasks";

export async function createTaskAction(input: {
  name: string;
  qty?: number;
  deliveryDate?: string | null;
  stepId?: string | null;
  templateTaskCode?: string | null;
}) {
  if (!isDrizzleBackend()) {
    throw new Error("createTaskAction requires DATA_BACKEND=drizzle");
  }
  const task = await createTask(input);
  revalidateTag("drizzle:tasks", "default");
  return task;
}

export async function listTasksAction() {
  if (!isDrizzleBackend()) {
    throw new Error("listTasksAction requires DATA_BACKEND=drizzle");
  }
  return listTasks();
}

export async function listSubTasksAction(taskId: string) {
  if (!isDrizzleBackend()) {
    throw new Error("listSubTasksAction requires DATA_BACKEND=drizzle");
  }
  return listSubTasksForTask(taskId);
}

export async function recordActivityAction(input: {
  subTaskId: string;
  colaboratorId: string;
  action: "started" | "stoped";
  qty?: number;
}) {
  if (!isDrizzleBackend()) {
    throw new Error("recordActivityAction requires DATA_BACKEND=drizzle");
  }
  const activity = await recordActivity(input);
  revalidateTag("drizzle:activities", "default");
  revalidateTag("drizzle:balances", "default");
  return activity;
}

export async function getMyBalanceAction(input: {
  userId: string;
  currencyId: string;
}) {
  if (!isDrizzleBackend()) {
    throw new Error("getMyBalanceAction requires DATA_BACKEND=drizzle");
  }
  return getOrCreateMonthlyBalance(input);
}

export async function redeemAwardAction(input: {
  userId: string;
  awardId: string;
  currencyId: string;
  qty: number;
}) {
  if (!isDrizzleBackend()) {
    throw new Error("redeemAwardAction requires DATA_BACKEND=drizzle");
  }
  const result = await redeemAward(input);
  revalidateTag("drizzle:exchanges", "default");
  revalidateTag("drizzle:balances", "default");
  return result;
}

export async function kioskIdentifyByCodeAction(input: {
  code: number;
  password: string;
}) {
  if (!isDrizzleBackend()) {
    throw new Error("kioskIdentifyByCodeAction requires DATA_BACKEND=drizzle");
  }
  return identifyColaboratorByCode(input);
}

export async function kioskIdentifyByTagAction(userTag: string) {
  if (!isDrizzleBackend()) {
    throw new Error("kioskIdentifyByTagAction requires DATA_BACKEND=drizzle");
  }
  return identifyColaboratorByTag(userTag);
}

export async function kioskIdentifyByFaceAction(probe: number[]) {
  if (!isDrizzleBackend()) {
    throw new Error("kioskIdentifyByFaceAction requires DATA_BACKEND=drizzle");
  }
  return identifyColaboratorByFace(probe);
}
