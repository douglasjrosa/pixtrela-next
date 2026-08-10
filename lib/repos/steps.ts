import { eq } from "drizzle-orm";

import { steps, tasks } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export type StepRecord = {
  id: string;
  name: string;
  index: number;
};

export type CreateStepInput = {
  name: string;
  index?: number;
};

export async function listSteps(db: Db = getDb()): Promise<StepRecord[]> {
  const rows = await db
    .select({
      id: steps.id,
      name: steps.name,
      index: steps.index,
    })
    .from(steps)
    .orderBy(steps.index, steps.name);
  return rows;
}

export async function createStep(
  input: CreateStepInput,
  db: Db = getDb(),
): Promise<StepRecord> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("stepNameRequired");
  }
  const [row] = await db
    .insert(steps)
    .values({
      name,
      index: input.index ?? 0,
    })
    .returning({
      id: steps.id,
      name: steps.name,
      index: steps.index,
    });
  return row;
}

export async function getStepById(
  id: string,
  db: Db = getDb(),
): Promise<StepRecord | null> {
  const [row] = await db
    .select({
      id: steps.id,
      name: steps.name,
      index: steps.index,
    })
    .from(steps)
    .where(eq(steps.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateStepName(
  id: string,
  name: string,
  db: Db = getDb(),
): Promise<StepRecord> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("stepNameRequired");
  const [row] = await db
    .update(steps)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(steps.id, id))
    .returning({
      id: steps.id,
      name: steps.name,
      index: steps.index,
    });
  if (!row) throw new Error("stepNotFound");
  return row;
}

export async function updateStepIndex(
  id: string,
  index: number,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(steps)
    .set({ index, updatedAt: new Date() })
    .where(eq(steps.id, id));
}

/**
 * Hard-deletes a step like Strapi. Tasks referencing it lose the column
 * assignment (`step_id` set to null) so the FK does not block the delete.
 */
export async function deleteStep(id: string, db: Db = getDb()): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ stepId: null, updatedAt: new Date() })
      .where(eq(tasks.stepId, id));
    await tx.delete(steps).where(eq(steps.id, id));
  });
}
