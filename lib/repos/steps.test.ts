import { afterAll, beforeAll, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { tasks } from "@/drizzle/schema";
import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import {
  createStep,
  deleteStep,
  getStepById,
  listSteps,
  updateStepName,
} from "@/lib/repos/steps";
import { createTask } from "@/lib/repos/tasks";

describeWithDb("steps repo CRUD", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates, updates, lists, and deletes a step", async () => {
    const suffix = String(Date.now());
    const created = await createStep({
      name: `CRUD Step ${suffix}`,
      index: 99,
    });
    expect(created.id).toBeTruthy();

    const renamed = await updateStepName(created.id, `Renamed ${suffix}`);
    expect(renamed.name).toBe(`Renamed ${suffix}`);

    const listed = await listSteps();
    expect(listed.some((row) => row.id === created.id)).toBe(true);

    await deleteStep(created.id);
    expect(await getStepById(created.id)).toBeNull();
  });

  it("deletes a step even when tasks still reference it", async () => {
    const suffix = String(Date.now());
    const step = await createStep({
      name: `Linked Step ${suffix}`,
      index: 100,
    });
    const task = await createTask({
      name: `Task on step ${suffix}`,
      stepId: step.id,
      qty: 1,
    });

    await deleteStep(step.id);

    expect(await getStepById(step.id)).toBeNull();
    const db = getDb();
    const [row] = await db
      .select({ stepId: tasks.stepId })
      .from(tasks)
      .where(eq(tasks.id, task.id))
      .limit(1);
    expect(row?.stepId).toBeNull();
  });
});
