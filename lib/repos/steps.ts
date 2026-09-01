import { eq } from "drizzle-orm";

import { steps, tasks } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import {
  STEP_TASKS_PER_LOAD_DEFAULT,
  type StepTaskOrderBy,
} from "@/lib/schemas/step";

export type StepRecord = {
  id: string;
  name: string;
  index: number;
  taskOrderBy: StepTaskOrderBy;
  tasksPerLoad: number;
};

export type CreateStepInput = {
  name: string;
  index?: number;
  taskOrderBy?: StepTaskOrderBy;
  tasksPerLoad?: number;
};

const STEP_COLUMNS = {
  id: steps.id,
  name: steps.name,
  index: steps.index,
  taskOrderBy: steps.taskOrderBy,
  tasksPerLoad: steps.tasksPerLoad,
} as const;

export async function listSteps(db: Db = getDb()): Promise<StepRecord[]> {
  const rows = await db
    .select(STEP_COLUMNS)
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
      taskOrderBy: input.taskOrderBy ?? "manual",
      tasksPerLoad: input.tasksPerLoad ?? STEP_TASKS_PER_LOAD_DEFAULT,
    })
    .returning(STEP_COLUMNS);
  return row;
}

export async function getStepById(
  id: string,
  db: Db = getDb(),
): Promise<StepRecord | null> {
  const [row] = await db
    .select(STEP_COLUMNS)
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
    .returning(STEP_COLUMNS);
  if (!row) throw new Error("stepNotFound");
  return row;
}

export type UpdateStepFieldsInput = {
  name?: string;
  taskOrderBy?: StepTaskOrderBy;
  tasksPerLoad?: number;
};

export async function updateStepFields(
  id: string,
  input: UpdateStepFieldsInput,
  db: Db = getDb(),
): Promise<StepRecord> {
  const patch: {
    name?: string;
    taskOrderBy?: StepTaskOrderBy;
    tasksPerLoad?: number;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) throw new Error("stepNameRequired");
    patch.name = trimmed;
  }
  if (input.taskOrderBy !== undefined) {
    patch.taskOrderBy = input.taskOrderBy;
  }
  if (input.tasksPerLoad !== undefined) {
    patch.tasksPerLoad = input.tasksPerLoad;
  }

  const [row] = await db
    .update(steps)
    .set(patch)
    .where(eq(steps.id, id))
    .returning(STEP_COLUMNS);
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
