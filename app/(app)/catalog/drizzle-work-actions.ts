"use server";

import { revalidateTag } from "next/cache";

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
  const task = await createTask(input);
  revalidateTag("drizzle:tasks", "default");
  return task;
}

export async function listTasksAction() {
  return listTasks();
}

export async function listSubTasksAction(taskId: string) {
  return listSubTasksForTask(taskId);
}

export async function recordActivityAction(input: {
  subTaskId: string;
  colaboratorId: string;
  action: "started" | "stoped";
  qty?: number;
}) {
  const activity = await recordActivity(input);
  revalidateTag("drizzle:activities", "default");
  revalidateTag("drizzle:balances", "default");
  return activity;
}

export async function getMyBalanceAction(input: {
  userId: string;
  currencyId: string;
}) {
  return getOrCreateMonthlyBalance(input);
}

export async function redeemAwardAction(input: {
  userId: string;
  awardId: string;
  currencyId: string;
  qty: number;
}) {
  const result = await redeemAward(input);
  revalidateTag("drizzle:exchanges", "default");
  revalidateTag("drizzle:balances", "default");
  return result;
}

export async function kioskIdentifyByCodeAction(input: {
  code: number;
  password: string;
}) {
  return identifyColaboratorByCode(input);
}

export async function kioskIdentifyByTagAction(userTag: string) {
  return identifyColaboratorByTag(userTag);
}

export async function kioskIdentifyByFaceAction(probe: number[]) {
  return identifyColaboratorByFace(probe);
}
