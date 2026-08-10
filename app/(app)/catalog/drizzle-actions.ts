"use server";

import { revalidateTag } from "next/cache";

import { isDrizzleBackend } from "@/lib/db/backend";
import { createAward, listAwards } from "@/lib/repos/awards";
import { createStep, listSteps } from "@/lib/repos/steps";

export async function listStepsAction() {
  if (!isDrizzleBackend()) {
    throw new Error("listStepsAction requires DATA_BACKEND=drizzle");
  }
  return listSteps();
}

export async function createStepAction(input: { name: string; index?: number }) {
  if (!isDrizzleBackend()) {
    throw new Error("createStepAction requires DATA_BACKEND=drizzle");
  }
  const step = await createStep(input);
  revalidateTag("drizzle:steps");
  return step;
}

export async function listAwardsAction() {
  if (!isDrizzleBackend()) {
    throw new Error("listAwardsAction requires DATA_BACKEND=drizzle");
  }
  return listAwards();
}

export async function createAwardAction(input: {
  name: string;
  title?: string;
  description?: string;
  prices?: Array<{ currencyId: string; numberOf: number }>;
}) {
  if (!isDrizzleBackend()) {
    throw new Error("createAwardAction requires DATA_BACKEND=drizzle");
  }
  const award = await createAward(input);
  revalidateTag("drizzle:awards");
  return award;
}
