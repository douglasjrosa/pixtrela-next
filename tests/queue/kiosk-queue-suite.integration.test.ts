import { afterAll, beforeAll, expect, it } from "vitest";

import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { startChain, confirmChainStop } from "@/lib/repos/kiosk-chains";
import {
  listKioskQueueSectionPage,
  startSubTask,
  stopSubTask,
} from "@/lib/repos/kiosk-subtasks";
import { listSubTasksForTask } from "@/lib/repos/tasks";

import { idleStartCount } from "./queue-task";
import {
  seedQueueCategoryWithFlags,
  seedQueueScenario,
} from "./seed-queue-scenario";

function pageStartCount(
  page: Awaited<ReturnType<typeof listKioskQueueSectionPage>>,
): number {
  return idleStartCount([...page.producingUnits, ...page.units]);
}

async function liberadas(colaboratorId: string) {
  return listKioskQueueSectionPage({
    colaboratorId,
    section: "liberadas",
  });
}

describeWithDb("kiosk queue suite — sessions", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it(
    "walks qty half/remaining, duration pause/finish, and chain pause/finish",
    async () => {
      const seed = await seedQueueScenario({
        label: "walk",
        subTasks: [
          {
            name: "Qty pieces",
            sharingType: "qty",
            qty: 10,
            expectedTime: 30,
            index: 0,
          },
          {
            name: "Duration solo",
            sharingType: "duration",
            expectedTime: 30,
            index: 1,
          },
          {
            name: "Chain A",
            sharingType: "duration",
            expectedTime: 30,
            index: 2,
          },
          {
            name: "Chain B",
            sharingType: "duration",
            expectedTime: 30,
            index: 3,
            linkedToPrevious: true,
          },
        ],
      });
      const workerId = seed.workers[0]!.id;
      const [qty, duration, chainA, chainB] = seed.subTasks;
      expect(qty && duration && chainA && chainB).toBeTruthy();

      let page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(1);

      await startSubTask(workerId, qty!.id);
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(0);

      await stopSubTask(workerId, qty!.id, { qty: 5 });
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(1);
      const qtyAfterHalf = (await listSubTasksForTask(seed.taskId)).find(
        (row) => row.id === qty!.id,
      );
      expect(qtyAfterHalf?.status).toBe("waiting");

      await startSubTask(workerId, qty!.id);
      await stopSubTask(workerId, qty!.id, { qty: 5 });
      const qtyDone = (await listSubTasksForTask(seed.taskId)).find(
        (row) => row.id === qty!.id,
      );
      expect(qtyDone?.status).toBe("finished");
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(1);

      await startSubTask(workerId, duration!.id);
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(0);
      await stopSubTask(workerId, duration!.id, { completed: false });
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(1);

      await startSubTask(workerId, duration!.id);
      await stopSubTask(workerId, duration!.id, { completed: true });
      const durationDone = (await listSubTasksForTask(seed.taskId)).find(
        (row) => row.id === duration!.id,
      );
      expect(durationDone?.status).toBe("finished");
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(1);

      const { chainRunId } = await startChain(workerId, chainA!.id);
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(0);
      await confirmChainStop(workerId, chainRunId, [
        { documentId: chainA!.id, completed: false },
        { documentId: chainB!.id, completed: false },
      ]);
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(1);

      const { chainRunId: run2 } = await startChain(workerId, chainA!.id);
      await confirmChainStop(workerId, run2, [
        { documentId: chainA!.id, completed: true },
        { documentId: chainB!.id, completed: true },
      ]);
      const chainRows = await listSubTasksForTask(seed.taskId);
      expect(chainRows.find((row) => row.id === chainA!.id)?.status).toBe(
        "finished",
      );
      expect(chainRows.find((row) => row.id === chainB!.id)?.status).toBe(
        "finished",
      );
      page = await liberadas(workerId);
      expect(pageStartCount(page)).toBe(0);
    },
    60_000,
  );

  it(
    "lets two workers share qty without a second idle Iniciar per viewer",
    async () => {
      const seed = await seedQueueScenario({
        label: "peers",
        workerCount: 2,
        subTasks: [
          {
            name: "Shared qty",
            sharingType: "qty",
            qty: 10,
            expectedTime: 30,
            maxSameTimeWorkers: 2,
            index: 0,
          },
          {
            name: "After",
            sharingType: "duration",
            expectedTime: 20,
            index: 1,
          },
        ],
      });
      const [workerA, workerB] = seed.workers;
      const qtyId = seed.subTasks[0]!.id;

      await startSubTask(workerA!.id, qtyId);
      const pageA = await liberadas(workerA!.id);
      const pageB = await liberadas(workerB!.id);
      expect(pageStartCount(pageA)).toBe(0);
      expect(pageStartCount(pageB)).toBe(2);

      await startSubTask(workerB!.id, qtyId);
      expect(pageStartCount(await liberadas(workerA!.id))).toBe(0);
      expect(pageStartCount(await liberadas(workerB!.id))).toBe(0);

      await stopSubTask(workerA!.id, qtyId, { qty: 4 });
      await stopSubTask(workerB!.id, qtyId, { qty: 6 });
      const qtyRow = (await listSubTasksForTask(seed.taskId)).find(
        (row) => row.id === qtyId,
      );
      expect(qtyRow?.status).toBe("finished");
      expect(pageStartCount(await liberadas(workerA!.id))).toBe(1);
      expect(pageStartCount(await liberadas(workerB!.id))).toBe(1);
    },
    45_000,
  );

  it(
    "hides an at-capacity subtask from the idle third assignee",
    async () => {
      const seed = await seedQueueScenario({
        label: "cap3",
        workerCount: 3,
        subTasks: [
          {
            name: "Shared",
            sharingType: "duration",
            expectedTime: 30,
            maxSameTimeWorkers: 2,
            index: 0,
          },
          {
            name: "After",
            sharingType: "duration",
            expectedTime: 20,
            index: 1,
          },
        ],
      });
      const [workerA, workerB, workerC] = seed.workers;
      const sharedId = seed.subTasks[0]!.id;
      const afterId = seed.subTasks[1]!.id;

      await startSubTask(workerA!.id, sharedId);
      await startSubTask(workerB!.id, sharedId);

      const pageC = await liberadas(workerC!.id);
      const visibleIds = [...pageC.producingUnits, ...pageC.units].map((unit) =>
        unit.type === "group" ? unit.headId : unit.subTask.documentId,
      );
      expect(visibleIds).not.toContain(sharedId);
      expect(visibleIds).toContain(afterId);
      await expect(startSubTask(workerC!.id, sharedId)).rejects.toThrow(
        "atWorkerCapacity",
      );
    },
    45_000,
  );

  it(
    "rejects producer finish without flags and accepts pause without flags",
    async () => {
      const { categoryId, flagIds } = await seedQueueCategoryWithFlags(
        "flags",
        2,
      );
      const seed = await seedQueueScenario({
        label: "flags",
        subTasks: [
          {
            name: "Producer",
            sharingType: "duration",
            expectedTime: 20,
            index: 0,
            subTaskCategoryId: categoryId,
          },
          {
            name: "Consumer",
            sharingType: "duration",
            expectedTime: 20,
            index: 1,
            dependencyIndexes: [0],
          },
        ],
      });
      const workerId = seed.workers[0]!.id;
      const producerId = seed.subTasks[0]!.id;

      await startSubTask(workerId, producerId);
      await expect(
        stopSubTask(workerId, producerId, { completed: true }),
      ).rejects.toThrow("flagsRequired");
      expect(pageStartCount(await liberadas(workerId))).toBe(0);

      await stopSubTask(workerId, producerId, { completed: false });
      expect(pageStartCount(await liberadas(workerId))).toBe(1);

      await startSubTask(workerId, producerId);
      await stopSubTask(workerId, producerId, {
        completed: true,
        flagIds: [flagIds[0]!],
      });
      const rows = await listSubTasksForTask(seed.taskId);
      expect(rows[0]?.status).toBe("finished");
      expect(pageStartCount(await liberadas(workerId))).toBe(1);
    },
    45_000,
  );
});
