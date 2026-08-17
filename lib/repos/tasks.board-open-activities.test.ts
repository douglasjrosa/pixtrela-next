import { afterAll, beforeAll, expect, it } from "vitest";

import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { createStep } from "@/lib/repos/steps";
import {
  assignColaboratorsToSubTask,
  createTask,
  listBoardSubtaskOpenActivities,
  listSubTasksForTask,
  recordActivity,
} from "@/lib/repos/tasks";
import { createTemplateTask } from "@/lib/repos/templates";
import { createUser } from "@/lib/repos/users";

describeWithDb("listBoardSubtaskOpenActivities", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it(
    "returns only the latest open start per colaborator",
    async () => {
    const suffix = String(Date.now());
    const colaborator = await createUser({
      username: `open-act-${suffix}`,
      password: "Secret123!",
      name: "Ana",
      role: "colaborator",
      code: Number(suffix.slice(-6)),
    });
    const step = await createStep({ name: `Step ${suffix}`, index: 0 });
    await createTemplateTask({
      code: `OA${suffix.slice(-7)}`,
      name: `Tpl ${suffix}`,
      subTasks: [{ name: "Cut", expectedTime: 10, index: 0 }],
    });
    const task = await createTask({
      name: `Task ${suffix}`,
      qty: 1,
      stepId: step.id,
      templateTaskCode: `OA${suffix.slice(-7)}`,
    });
    const [sub] = await listSubTasksForTask(task.id);
    if (!sub) throw new Error("missing subtask");
    await assignColaboratorsToSubTask(sub.id, [colaborator.id]);

    await recordActivity({
      subTaskId: sub.id,
      colaboratorId: colaborator.id,
      action: "started",
      timestamp: new Date("2026-08-17T10:00:00Z"),
    });
    await recordActivity({
      subTaskId: sub.id,
      colaboratorId: colaborator.id,
      action: "stoped",
      timestamp: new Date("2026-08-17T10:01:00Z"),
    });
    await recordActivity({
      subTaskId: sub.id,
      colaboratorId: colaborator.id,
      action: "started",
      timestamp: new Date("2026-08-17T10:02:00Z"),
    });

    const open = await listBoardSubtaskOpenActivities([sub.id]);
    expect(open).toHaveLength(1);
    expect(open[0]?.colaboratorId).toBe(colaborator.id);
    expect(open[0]?.timestamp.toISOString()).toBe("2026-08-17T10:02:00.000Z");

    await recordActivity({
      subTaskId: sub.id,
      colaboratorId: colaborator.id,
      action: "stoped",
      timestamp: new Date("2026-08-17T10:03:00Z"),
    });
    const closed = await listBoardSubtaskOpenActivities([sub.id]);
    expect(closed).toEqual([]);
  },
  45_000,
);
});
