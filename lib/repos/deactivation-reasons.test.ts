import { eq } from "drizzle-orm";
import { afterAll, beforeAll, expect, it } from "vitest";

import { tasks } from "@/drizzle/schema";
import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { DEACTIVATION_TABLE } from "@/lib/domain/deactivation-tables";
import { DEACTIVATION_REASON_MIN_LENGTH } from "@/lib/schemas/deactivation-reason";
import {
  archiveRecords,
  findLatestDeactivationReason,
  insertDeactivationReason,
} from "@/lib/repos/deactivation-reasons";
import { createTask } from "@/lib/repos/tasks";

const LONG_REASON = "a".repeat(DEACTIVATION_REASON_MIN_LENGTH);

describeWithDb("deactivation-reasons repo", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("inserts a reason for one or more record ids", async () => {
    const taskA = await createTask({ name: `Reason A ${Date.now()}` });
    const taskB = await createTask({ name: `Reason B ${Date.now()}` });

    const row = await insertDeactivationReason({
      tableName: DEACTIVATION_TABLE.tasks,
      recordIds: [taskA.id, taskB.id],
      text: LONG_REASON,
    });

    expect(row.tableName).toBe(DEACTIVATION_TABLE.tasks);
    expect(row.recordIds).toEqual([taskA.id, taskB.id]);
    expect(row.text).toBe(LONG_REASON);
  });

  it("rejects empty recordIds", async () => {
    await expect(
      insertDeactivationReason({
        tableName: DEACTIVATION_TABLE.tasks,
        recordIds: [],
        text: LONG_REASON,
      }),
    ).rejects.toThrow("emptyRecordIds");
  });

  it("findLatestDeactivationReason returns the newest matching row", async () => {
    const task = await createTask({ name: `Latest ${Date.now()}` });

    await insertDeactivationReason({
      tableName: DEACTIVATION_TABLE.tasks,
      recordIds: [task.id],
      text: `${LONG_REASON}-old`,
    });
    await insertDeactivationReason({
      tableName: DEACTIVATION_TABLE.tasks,
      recordIds: [task.id],
      text: `${LONG_REASON}-new`,
    });

    const latest = await findLatestDeactivationReason(
      DEACTIVATION_TABLE.tasks,
      task.id,
    );
    expect(latest?.text).toBe(`${LONG_REASON}-new`);
  });

  it("archiveRecords soft-archives and writes one reason row", async () => {
    const db = getDb();
    const taskA = await createTask({ name: `Arch A ${Date.now()}` });
    const taskB = await createTask({ name: `Arch B ${Date.now()}` });

    const reason = await archiveRecords({
      tableName: DEACTIVATION_TABLE.tasks,
      recordIds: [taskA.id, taskB.id],
      text: LONG_REASON,
      setInactive: async (ids, tx) => {
        for (const id of ids) {
          await tx
            .update(tasks)
            .set({ active: false, updatedAt: new Date() })
            .where(eq(tasks.id, id));
        }
      },
    });

    expect(reason.recordIds).toEqual([taskA.id, taskB.id]);

    const [rowA] = await db
      .select({ active: tasks.active })
      .from(tasks)
      .where(eq(tasks.id, taskA.id));
    const [rowB] = await db
      .select({ active: tasks.active })
      .from(tasks)
      .where(eq(tasks.id, taskB.id));
    expect(rowA?.active).toBe(false);
    expect(rowB?.active).toBe(false);
  });
});
