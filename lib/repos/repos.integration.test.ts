import { afterAll, beforeAll, expect, it } from "vitest";

import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { createAward, createCurrency, deleteAward, findAwardById, hardDeleteAward } from "@/lib/repos/awards";
import {
  creditBalanceIncome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import { redeemAward } from "@/lib/repos/exchanges";
import { identifyColaboratorByCode } from "@/lib/repos/kiosk";
import {
  listAssignedSubTasks,
  startSubTask,
  stopSubTask,
} from "@/lib/repos/kiosk-subtasks";
import {
  advanceChainRun,
  confirmChainStop,
  startChain,
} from "@/lib/repos/kiosk-chains";
import { createStep, listSteps } from "@/lib/repos/steps";
import {
  assignColaboratorsToSubTask,
  createTask,
  getTaskById,
  listSubTasksForTask,
  recordActivity,
} from "@/lib/repos/tasks";
import { createTeam } from "@/lib/repos/teams";
import { createTemplateTask } from "@/lib/repos/templates";
import { createUser } from "@/lib/repos/users";
import { activities, currencies, currencyForSubtasks, exchanges } from "@/drizzle/schema";
import { asc, eq } from "drizzle-orm";

describeWithDb("drizzle repos integration", () => {
  beforeAll(async () => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates steps", async () => {
    const step = await createStep({ name: `Step ${Date.now()}`, index: 0 });
    expect(step.id).toBeTruthy();
    const all = await listSteps();
    expect(all.some((row) => row.id === step.id)).toBe(true);
  });

  it(
    "redeems award inside exchange window with debit",
    async () => {
      const suffix = String(Date.now());
      const currency = await createCurrency({
        name: `Estrela-${suffix}`,
        currencyPerSecond: 1,
      });
      const colaborator = await createUser({
        username: `colab-${suffix}`,
        password: "Secret123!",
        name: "Colab",
        role: "colaborator",
        code: Number(suffix.slice(-6)),
      });
      await createTeam({
        name: `Team ${suffix}`,
        memberIds: [colaborator.id],
        exchangesFirstDay: 1,
        exchangesLastDay: 31,
      });
      const award = await createAward({
        name: `Award ${suffix}`,
        stock: 10,
        prices: [{ currencyId: currency.id, numberOf: 5 }],
      });

      const balance = await getOrCreateMonthlyBalance({
        userId: colaborator.id,
        currencyPluralTitle: resolveCurrencyPluralTitle(currency),
        now: new Date("2026-08-09T12:00:00Z"),
      });
      await creditBalanceIncome({ balanceId: balance.id, amount: 20 });

      const result = await redeemAward({
        userId: colaborator.id,
        awardId: award.id,
        currencyId: currency.id,
        qty: 2,
        now: new Date("2026-08-09T12:00:00Z"),
      });

      expect(result.cost).toBe(10);
      expect(result.exchangeId).toBeTruthy();
      const stockAfter = await findAwardById(award.id);
      expect(stockAfter?.stock).toBe(8);
    },
    45_000,
  );

  it(
    "hard-deletes archived award while preserving exchange history labels",
    async () => {
      const suffix = String(Date.now());
      const currency = await createCurrency({
        name: `DelAward-${suffix}`,
        currencyPerSecond: 1,
      });
      const colaborator = await createUser({
        username: `del-colab-${suffix}`,
        password: "Secret123!",
        name: "Del Colab",
        role: "colaborator",
        code: Number(String(suffix).slice(-6)),
      });
      await createTeam({
        name: `Del Team ${suffix}`,
        memberIds: [colaborator.id],
        exchangesFirstDay: 1,
        exchangesLastDay: 31,
      });
      const award = await createAward({
        name: `Del Award ${suffix}`,
        stock: 5,
        prices: [{ currencyId: currency.id, numberOf: 1 }],
      });

      const balance = await getOrCreateMonthlyBalance({
        userId: colaborator.id,
        currencyPluralTitle: resolveCurrencyPluralTitle(currency),
        now: new Date("2026-08-09T12:00:00Z"),
      });
      await creditBalanceIncome({ balanceId: balance.id, amount: 20 });

      await redeemAward({
        userId: colaborator.id,
        awardId: award.id,
        currencyId: currency.id,
        qty: 1,
        now: new Date("2026-08-09T12:00:00Z"),
      });

      const [exchangeBeforeDelete] = await getDb()
        .select({
          awardTitle: exchanges.awardTitle,
          currencyPluralTitle: exchanges.currencyPluralTitle,
        })
        .from(exchanges)
        .where(eq(exchanges.userId, colaborator.id))
        .limit(1);

      await deleteAward(award.id);
      await hardDeleteAward(award.id);

      expect(await findAwardById(award.id)).toBeNull();
      const [exchangeAfterDelete] = await getDb()
        .select({
          awardTitle: exchanges.awardTitle,
          currencyPluralTitle: exchanges.currencyPluralTitle,
        })
        .from(exchanges)
        .where(eq(exchanges.userId, colaborator.id))
        .limit(1);
      expect(exchangeAfterDelete).toEqual(exchangeBeforeDelete);
      expect(exchangeAfterDelete?.awardTitle).toBe(`Del Award ${suffix}`);
    },
    45_000,
  );

  it(
    "copies template subtasks, unlocks root row, and credits stars on finish",
    async () => {
      const suffix = String(Date.now());
      const currency = await createCurrency({
        name: `Pay-${suffix}`,
        currencyPerSecond: 1,
      });
      const db = getDb();
      await db.delete(currencyForSubtasks);
      await db.insert(currencyForSubtasks).values({ currencyId: currency.id });

      const colaborator = await createUser({
        username: `worker-${suffix}`,
        password: "Secret123!",
        name: "Worker",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });

      await createTemplateTask({
        code: `T${suffix.slice(-8)}`,
        name: "Template",
        subTasks: [
          { name: "Cut", expectedTime: 10, index: 0 },
          { name: "Pack", expectedTime: 5, index: 1, dependencyIndexes: [0] },
        ],
      });

      const step = await createStep({ name: `Queue ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Task ${suffix}`,
        qty: 2,
        stepId: step.id,
        templateTaskCode: `T${suffix.slice(-8)}`,
      });

      const subs = await listSubTasksForTask(task.id);
      expect(subs).toHaveLength(2);
      expect(subs[0]?.expectedTime).toBe(20);
      expect(fromDrizzleActivationStatus(subs[0]?.activationStatus)).toBe(
        "unlocked",
      );
      expect(fromDrizzleActivationStatus(subs[1]?.activationStatus)).toBe(
        "locked",
      );

      await assignColaboratorsToSubTask(subs[0]!.id, [colaborator.id]);

      const startedAt = new Date("2026-08-09T10:00:00Z");
      const stoppedAt = new Date("2026-08-09T10:00:30Z");
      await recordActivity({
        subTaskId: subs[0]!.id,
        colaboratorId: colaborator.id,
        action: "started",
        timestamp: startedAt,
      });
      const stop = await recordActivity({
        subTaskId: subs[0]!.id,
        colaboratorId: colaborator.id,
        action: "stoped",
        completed: true,
        timestamp: stoppedAt,
      });
      expect(stop.currencyAwarded).toBe(20);

      const refreshedTask = await getTaskById(task.id);
      expect(refreshedTask?.status).toBe("paused");

      const identified = await identifyColaboratorByCode({
        code: colaborator.code,
        password: "Secret123!",
      });
      expect(identified?.id).toBe(colaborator.id);

      const [stillThere] = await db
        .select()
        .from(currencies)
        .where(eq(currencies.id, currency.id))
        .limit(1);
      expect(stillThere).toBeTruthy();
    },
    45_000,
  );

  it(
    "lists kiosk queue for assignees only and unlocks dependent subtask",
    async () => {
      const suffix = String(Date.now());
      const workerA = await createUser({
        username: `ka-${suffix}`,
        password: "Secret123!",
        name: "Worker A",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      const workerB = await createUser({
        username: `kb-${suffix}`,
        password: "Secret123!",
        name: "Worker B",
        role: "colaborator",
        code: Number(String(Number(suffix.slice(-5)) + 1).slice(-5)),
      });

      await createTemplateTask({
        code: `K${suffix.slice(-7)}`,
        name: "Kiosk template",
        subTasks: [
          { name: "First", expectedTime: 10, index: 0 },
          { name: "Second", expectedTime: 5, index: 1, dependencyIndexes: [0] },
        ],
      });

      const step = await createStep({ name: `Kiosk ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Kiosk task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `K${suffix.slice(-7)}`,
      });

      const subs = await listSubTasksForTask(task.id);
      const [first, second] = subs;
      expect(first).toBeTruthy();
      expect(second).toBeTruthy();

      await assignColaboratorsToSubTask(first!.id, [workerA.id]);
      await assignColaboratorsToSubTask(second!.id, [workerB.id]);

      expect(await listAssignedSubTasks(workerA.id)).toHaveLength(1);
      expect(await listAssignedSubTasks(workerB.id)).toHaveLength(1);

      const t0 = new Date("2026-08-10T10:00:00Z");
      await startSubTask(workerA.id, first!.id, undefined, t0);
      await stopSubTask(
        workerA.id,
        first!.id,
        { completed: true },
        undefined,
        new Date("2026-08-10T10:05:00Z"),
      );

      const refreshed = await listSubTasksForTask(task.id);
      const secondRow = refreshed.find((row) => row.id === second!.id);
      expect(fromDrizzleActivationStatus(secondRow?.activationStatus)).toBe(
        "unlocked",
      );
    },
    45_000,
  );

  it(
    "keeps orphan subtask on kiosk queue after unassign until stop",
    async () => {
      const suffix = String(Date.now());
      const worker = await createUser({
        username: `orphan-${suffix}`,
        password: "Secret123!",
        name: "Orphan Worker",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });

      await createTemplateTask({
        code: `O${suffix.slice(-7)}`,
        name: "Orphan template",
        subTasks: [{ name: "Solo", expectedTime: 10, index: 0 }],
      });

      const step = await createStep({ name: `Orphan ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Orphan task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `O${suffix.slice(-7)}`,
      });

      const [sub] = await listSubTasksForTask(task.id);
      expect(sub).toBeTruthy();

      await assignColaboratorsToSubTask(sub!.id, [worker.id]);
      const t0 = new Date("2026-08-11T10:00:00Z");
      await startSubTask(worker.id, sub!.id, undefined, t0);

      await assignColaboratorsToSubTask(sub!.id, []);

      const queue = await listAssignedSubTasks(worker.id);
      expect(queue.some((row) => row.documentId === sub!.id)).toBe(true);

      await stopSubTask(
        worker.id,
        sub!.id,
        { completed: true },
        undefined,
        new Date("2026-08-11T10:05:00Z"),
      );

      const afterStop = await listAssignedSubTasks(worker.id);
      expect(afterStop.some((row) => row.documentId === sub!.id)).toBe(false);
    },
    45_000,
  );

  it(
    "keeps duration subtask producing until the last worker stops",
    async () => {
      const suffix = String(Date.now());
      const workerA = await createUser({
        username: `mwa-${suffix}`,
        password: "Secret123!",
        name: "Worker A",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      const workerB = await createUser({
        username: `mwb-${suffix}`,
        password: "Secret123!",
        name: "Worker B",
        role: "colaborator",
        code: Number(String(Number(suffix.slice(-5)) + 1).slice(-5)),
      });

      await createTemplateTask({
        code: `M${suffix.slice(-7)}`,
        name: "Multi worker",
        subTasks: [
          {
            name: "Pair",
            expectedTime: 10,
            index: 0,
            maxSameTimeWorkers: 2,
          },
        ],
      });

      const step = await createStep({ name: `Multi ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Multi task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `M${suffix.slice(-7)}`,
      });

      const [sub] = await listSubTasksForTask(task.id);
      expect(sub).toBeTruthy();

      await assignColaboratorsToSubTask(sub!.id, [workerA.id, workerB.id]);

      const t0 = new Date("2026-08-12T10:00:00Z");
      await startSubTask(workerA.id, sub!.id, undefined, t0);
      await startSubTask(workerB.id, sub!.id, undefined, t0);

      const producingTask = await getTaskById(task.id);
      expect(producingTask?.status).toBe("producing");

      await stopSubTask(
        workerA.id,
        sub!.id,
        { completed: true },
        undefined,
        new Date("2026-08-12T10:03:00Z"),
      );

      const midSubs = await listSubTasksForTask(task.id);
      expect(midSubs[0]?.status).toBe("producing");

      await stopSubTask(
        workerB.id,
        sub!.id,
        { completed: true },
        undefined,
        new Date("2026-08-12T10:06:00Z"),
      );

      const finishedSubs = await listSubTasksForTask(task.id);
      expect(finishedSubs[0]?.status).toBe("finished");
      expect((await getTaskById(task.id))?.status).toBe("finished");
    },
    45_000,
  );

  it(
    "hides at-capacity subtask from non-active assignees",
    async () => {
      const suffix = String(Date.now());
      const workerA = await createUser({
        username: `capa-${suffix}`,
        password: "Secret123!",
        name: "Cap A",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      const workerB = await createUser({
        username: `capb-${suffix}`,
        password: "Secret123!",
        name: "Cap B",
        role: "colaborator",
        code: Number(String(Number(suffix.slice(-5)) + 1).slice(-5)),
      });

      await createTemplateTask({
        code: `C${suffix.slice(-7)}`,
        name: "Capacity",
        subTasks: [
          {
            name: "Single slot",
            expectedTime: 10,
            index: 0,
            maxSameTimeWorkers: 1,
          },
        ],
      });

      const step = await createStep({ name: `Cap ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Cap task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `C${suffix.slice(-7)}`,
      });

      const [sub] = await listSubTasksForTask(task.id);
      expect(sub).toBeTruthy();

      await assignColaboratorsToSubTask(sub!.id, [workerA.id, workerB.id]);

      await startSubTask(
        workerA.id,
        sub!.id,
        undefined,
        new Date("2026-08-13T10:00:00Z"),
      );

      expect(await listAssignedSubTasks(workerA.id)).toHaveLength(1);
      expect(await listAssignedSubTasks(workerB.id)).toHaveLength(0);
    },
    45_000,
  );

  it(
    "starts a chain, auto-advances, rewrites timestamps on confirm, and keeps helper producing",
    async () => {
      const suffix = String(Date.now());
      const worker = await createUser({
        username: `chain-${suffix}`,
        password: "Secret123!",
        name: "Chain Worker",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      const helper = await createUser({
        username: `chainh-${suffix}`,
        password: "Secret123!",
        name: "Chain Helper",
        role: "colaborator",
        code: Number(String(Number(suffix.slice(-5)) + 1).slice(-5)),
      });

      await createTemplateTask({
        code: `CH${suffix.slice(-6)}`,
        name: "Chain template",
        subTasks: [
          { name: "Cut", expectedTime: 10, index: 0 },
          {
            name: "Pack",
            expectedTime: 10,
            index: 1,
            linkedToPrevious: true,
            maxSameTimeWorkers: 2,
          },
          { name: "Ship", expectedTime: 10, index: 2, linkedToPrevious: true },
        ],
      });

      const step = await createStep({ name: `Chain ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Chain task ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `CH${suffix.slice(-6)}`,
      });
      const subs = await listSubTasksForTask(task.id);
      expect(subs).toHaveLength(3);
      expect(subs[1]?.linkedToPrevious).toBe(true);
      expect(subs[2]?.linkedToPrevious).toBe(true);

      await assignColaboratorsToSubTask(subs[0]!.id, [worker.id]);
      await assignColaboratorsToSubTask(subs[1]!.id, [worker.id, helper.id]);
      await assignColaboratorsToSubTask(subs[2]!.id, [worker.id]);

      const t0 = new Date("2026-08-16T10:00:00Z");
      const { chainRunId } = await startChain(worker.id, subs[0]!.id, undefined, t0);

      await advanceChainRun(
        chainRunId,
        undefined,
        new Date("2026-08-16T10:00:12Z"),
      );

      const afterAdvance = await listSubTasksForTask(task.id);
      expect(afterAdvance.find((row) => row.id === subs[0]!.id)?.status).toBe(
        "paused",
      );
      expect(afterAdvance.find((row) => row.id === subs[1]!.id)?.status).toBe(
        "producing",
      );

      await startSubTask(
        helper.id,
        subs[1]!.id,
        undefined,
        new Date("2026-08-16T10:00:13Z"),
      );

      await confirmChainStop(
        worker.id,
        chainRunId,
        [
          { documentId: subs[0]!.id, completed: true },
          { documentId: subs[1]!.id, completed: true },
          { documentId: subs[2]!.id, completed: false },
        ],
        undefined,
        new Date("2026-08-16T10:00:20Z"),
      );

      const db = getDb();
      const runRows = await db
        .select()
        .from(activities)
        .where(eq(activities.chainRunId, chainRunId))
        .orderBy(asc(activities.timestamp));
      const principalStops = runRows.filter(
        (row) => row.colaboratorId === worker.id && row.action === "stoped",
      );
      expect(principalStops.length).toBeGreaterThanOrEqual(2);
      expect(principalStops[0]?.timestamp.toISOString()).not.toBe(
        principalStops[1]?.timestamp.toISOString(),
      );

      const helperOpen = runRows.some(
        (row) =>
          row.colaboratorId === helper.id &&
          row.action === "started" &&
          !runRows.some(
            (stop) =>
              stop.colaboratorId === helper.id &&
              stop.action === "stoped" &&
              stop.subTaskId === row.subTaskId,
          ),
      );
      expect(helperOpen).toBe(true);

      const afterConfirm = await listSubTasksForTask(task.id);
      const pack = afterConfirm.find((row) => row.id === subs[1]!.id);
      expect(pack?.status).toBe("producing");
      const cut = afterConfirm.find((row) => row.id === subs[0]!.id);
      expect(cut?.status).toBe("finished");
      const ship = afterConfirm.find((row) => row.id === subs[2]!.id);
      expect(ship?.status).not.toBe("finished");
    },
    60_000,
  );
});
