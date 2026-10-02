import { eq } from "drizzle-orm";

import { tasks } from "@/drizzle/schema";
import { nextTaskStepIdAfterStatusChange } from "@/lib/business/task-automation-step";
import { getDb, type Db } from "@/lib/db/client";
import { getTaskAutomationSettings } from "@/lib/repos/settings";

export async function loadNextAutomatedTaskStepId(
  status: string,
  currentStepId: string | null,
  db: Db = getDb(),
): Promise<string | null> {
  const settings = await getTaskAutomationSettings(db);
  return nextTaskStepIdAfterStatusChange(currentStepId, status, settings);
}

export async function persistAutomatedTaskStep(input: {
  taskId: string;
  status: string;
  currentStepId: string | null;
  db?: Db;
}): Promise<string | null> {
  const db = input.db ?? getDb();
  const nextStepId = await loadNextAutomatedTaskStepId(
    input.status,
    input.currentStepId,
    db,
  );
  if (nextStepId === input.currentStepId) return nextStepId;

  await db
    .update(tasks)
    .set({ stepId: nextStepId, updatedAt: new Date() })
    .where(eq(tasks.id, input.taskId));
  return nextStepId;
}

export async function reorderTasksAfterStepMove(input: {
  previousStepId: string | null;
  nextStepId: string | null;
  deliveryDate: string | null;
  db?: Db;
}): Promise<void> {
  if (input.nextStepId === input.previousStepId) return;

  const { applyAutoStepTaskOrderingAfterTaskChange } = await import(
    "@/lib/business/apply-step-task-order"
  );
  await applyAutoStepTaskOrderingAfterTaskChange({
    before: {
      stepId: input.previousStepId,
      deliveryDate: input.deliveryDate,
    },
    after: {
      stepId: input.nextStepId,
      deliveryDate: input.deliveryDate,
    },
    db: input.db,
  });
}
