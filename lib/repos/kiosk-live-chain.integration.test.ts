import { afterAll, beforeAll, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { activities, subTasks } from "@/drizzle/schema";
import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { joinLiveChain } from "@/lib/repos/kiosk-chains";
import { startSubTask } from "@/lib/repos/kiosk-subtasks";
import { upsertKioskSettings } from "@/lib/repos/settings";
import { createStep } from "@/lib/repos/steps";
import {
  assignColaboratorsToSubTask,
  createTask,
  listSubTasksForTask,
} from "@/lib/repos/tasks";
import { createTemplateTask } from "@/lib/repos/templates";
import { createUser } from "@/lib/repos/users";

describeWithDb("joinLiveChain", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it(
    "links the next sibling without starting a second activity",
    async () => {
      const suffix = String(Date.now());
      await upsertKioskSettings({
        sessionIdleSeconds: 7,
        maxSimultaneousSubtaskIntervalSeconds: 300,
      });
      const worker = await createUser({
        username: `live-${suffix}`,
        password: "Secret123!",
        name: "Live Worker",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      await createTemplateTask({
        code: `L${suffix.slice(-7)}`,
        name: "Live template",
        subTasks: [
          { name: "One", expectedTime: 100, index: 0 },
          { name: "Two", expectedTime: 100, index: 1 },
        ],
      });
      const step = await createStep({ name: `Live ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Live task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `L${suffix.slice(-7)}`,
      });
      const subs = await listSubTasksForTask(task.id);
      const [first, second] = subs;
      expect(first).toBeTruthy();
      expect(second).toBeTruthy();

      await assignColaboratorsToSubTask(first!.id, [worker.id]);
      await assignColaboratorsToSubTask(second!.id, [worker.id]);

      await startSubTask(worker.id, first!.id);
      const result = await joinLiveChain(worker.id, second!.id);

      expect(result.chainRunId).toBeTruthy();
      const db = getDb();
      const [linked] = await db
        .select({ linkedToPrevious: subTasks.linkedToPrevious })
        .from(subTasks)
        .where(eq(subTasks.id, second!.id))
        .limit(1);
      expect(linked?.linkedToPrevious).toBe(true);

      const rows = await db
        .select({
          subTaskId: activities.subTaskId,
          action: activities.action,
          chainRunId: activities.chainRunId,
        })
        .from(activities)
        .where(eq(activities.colaboratorId, worker.id));
      const started = rows.filter((row) => row.action === "started");
      expect(started).toHaveLength(1);
      expect(started[0]?.subTaskId).toBe(first!.id);
      expect(started[0]?.chainRunId).toBe(result.chainRunId);
      expect(rows.some((row) => row.subTaskId === second!.id)).toBe(false);
    },
    45_000,
  );
});
