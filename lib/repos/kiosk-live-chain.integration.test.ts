import { afterAll, beforeAll, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { activities, openSessions, subTasks } from "@/drizzle/schema";
import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import {
  confirmChainStop,
  joinLiveChain,
  startChain,
} from "@/lib/repos/kiosk-chains";
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
        queuePageSize: 15,
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
        })
        .from(activities)
        .where(eq(activities.colaboratorId, worker.id));
      expect(rows).toHaveLength(0);
      const sessions = await db
        .select({
          subTaskId: openSessions.subTaskId,
          chainRunId: openSessions.chainRunId,
        })
        .from(openSessions)
        .where(eq(openSessions.userId, worker.id));
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.subTaskId).toBe(first!.id);
      expect(sessions[0]?.chainRunId).toBe(result.chainRunId);
    },
    45_000,
  );

  it(
    "writes activities on the chain run when the live session closes",
    async () => {
      const suffix = String(Date.now());
      await upsertKioskSettings({
        sessionIdleSeconds: 7,
        maxSimultaneousSubtaskIntervalSeconds: 300,
        queuePageSize: 15,
      });
      const worker = await createUser({
        username: `live-stop-${suffix}`,
        password: "Secret123!",
        name: "Live Stop Worker",
        role: "colaborator",
        code: Number(suffix.slice(-4)) + 1,
      });
      await createTemplateTask({
        code: `S${suffix.slice(-7)}`,
        name: "Live stop template",
        subTasks: [
          { name: "One", expectedTime: 100, index: 0 },
          { name: "Two", expectedTime: 100, index: 1 },
        ],
      });
      const step = await createStep({ name: `Live stop ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Live stop task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `S${suffix.slice(-7)}`,
      });
      const subs = await listSubTasksForTask(task.id);
      const [first, second] = subs;
      expect(first).toBeTruthy();
      expect(second).toBeTruthy();

      await assignColaboratorsToSubTask(first!.id, [worker.id]);
      await assignColaboratorsToSubTask(second!.id, [worker.id]);

      await startSubTask(worker.id, first!.id);
      const joined = await joinLiveChain(worker.id, second!.id);
      const beforeClose = await getDb()
        .select({ action: activities.action })
        .from(activities)
        .where(eq(activities.colaboratorId, worker.id));
      expect(beforeClose).toHaveLength(0);

      await confirmChainStop(
        worker.id,
        joined.chainRunId,
        [
          { documentId: first!.id, completed: true },
          { documentId: second!.id, completed: true },
        ],
        undefined,
        undefined,
        first!.id,
      );

      const db = getDb();
      const rows = await db
        .select({
          action: activities.action,
          chainRunId: activities.chainRunId,
        })
        .from(activities)
        .where(eq(activities.colaboratorId, worker.id));
      expect(rows.some((row) => row.action === "stoped")).toBe(true);
      expect(
        rows.every((row) => row.chainRunId === rows[0]?.chainRunId),
      ).toBe(true);
    },
    45_000,
  );

  it(
    "closes a table group run when the client omits chainRunId",
    async () => {
      const suffix = String(Date.now());
      const worker = await createUser({
        username: `null-run-${suffix}`,
        password: "Secret123!",
        name: "Null Run Worker",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      await createTemplateTask({
        code: `N${suffix.slice(-7)}`,
        name: "Null run template",
        subTasks: [
          { name: "Cut", expectedTime: 10, index: 0 },
          {
            name: "Pack",
            expectedTime: 10,
            index: 1,
            linkedToPrevious: true,
          },
        ],
      });
      const step = await createStep({ name: `Null run ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Null run task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `N${suffix.slice(-7)}`,
      });
      const subs = await listSubTasksForTask(task.id);
      const [first, second] = subs;
      expect(first).toBeTruthy();
      expect(second).toBeTruthy();
      await assignColaboratorsToSubTask(first!.id, [worker.id]);
      await assignColaboratorsToSubTask(second!.id, [worker.id]);

      await startChain(worker.id, first!.id);
      const before = await getDb()
        .select({ id: openSessions.id })
        .from(openSessions)
        .where(eq(openSessions.userId, worker.id));
      expect(before.length).toBeGreaterThan(0);

      await confirmChainStop(
        worker.id,
        null,
        [
          { documentId: first!.id, completed: true },
          { documentId: second!.id, completed: true },
        ],
        undefined,
        undefined,
        first!.id,
      );

      const after = await getDb()
        .select({ id: openSessions.id })
        .from(openSessions)
        .where(eq(openSessions.userId, worker.id));
      expect(after).toHaveLength(0);
    },
    45_000,
  );
});
