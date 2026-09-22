import { afterAll, beforeAll, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { activities, balances, currencyForSubtasks } from "@/drizzle/schema";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { createCurrency } from "@/lib/repos/awards";
import {
  cascadeMonthlyBalances,
  creditBalanceIncome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import {
  createActivity,
  updateActivityFields,
} from "@/lib/repos/activities";
import { confirmChainStop, startChain } from "@/lib/repos/kiosk-chains";
import { startSubTask } from "@/lib/repos/kiosk-subtasks";
import { createStep } from "@/lib/repos/steps";
import {
  assignColaboratorsToSubTask,
  createTask,
  listSubTasksForTask,
} from "@/lib/repos/tasks";
import { createTemplateTask } from "@/lib/repos/templates";
import { createUser } from "@/lib/repos/users";

describeWithDb("admin activity credit replay", () => {
  beforeAll(() => {
    getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it(
    "recomputes isolated qty on the stop month when admin edits qty",
    async () => {
      const suffix = String(Date.now());
      const db = getDb();
      const currency = await createCurrency({
        name: `QtyPay-${suffix}`,
        title: "Estrela",
        pluralTitle: "Estrelas",
        currencyPerSecond: 1,
      });
      await db.delete(currencyForSubtasks);
      await db.insert(currencyForSubtasks).values({ currencyId: currency.id });

      const colaborator = await createUser({
        username: `qty-admin-${suffix}`,
        password: "Secret123!",
        name: "Qty Admin",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      await createTemplateTask({
        code: `QA${suffix.slice(-6)}`,
        name: "Qty admin template",
        subTasks: [
          {
            name: "Cut",
            expectedTime: 10,
            qty: 10,
            sharingType: "qty",
            index: 0,
          },
        ],
      });
      const step = await createStep({ name: `QtyAdmin ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Qty admin ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `QA${suffix.slice(-6)}`,
      });
      const [sub] = await listSubTasksForTask(task.id);
      await assignColaboratorsToSubTask(sub!.id, [colaborator.id]);

      const created = await createActivity(
        {
          colaboratorId: colaborator.id,
          subTaskId: sub!.id,
          action: "stoped",
          date: "2026-08-09",
          time: "10:00",
          qty: 3,
        },
        db,
      );
      expect(created.currencyAwarded).toBe(30);

      await updateActivityFields(
        created.id,
        {
          colaboratorId: colaborator.id,
          subTaskId: sub!.id,
          action: "stoped",
          date: "2026-08-09",
          time: "10:00",
          qty: 7,
        },
        db,
      );
      const [updated] = await db
        .select({
          currencyAwarded: activities.currencyAwarded,
        })
        .from(activities)
        .where(eq(activities.id, created.id))
        .limit(1);
      expect(updated?.currencyAwarded).toBe(70);

      const month = await getOrCreateMonthlyBalance({
        userId: colaborator.id,
        currencyPluralTitle: resolveCurrencyPluralTitle(currency),
        now: new Date("2026-08-09T13:00:00.000Z"),
      });
      expect(month.totalIncome).toBe(70);
      expect(month.date).toBe("2026-08-01");
    },
    45_000,
  );

  it(
    "cascades later months of the same currency and leaves others intact",
    async () => {
      const suffix = String(Date.now());
      const colaborator = await createUser({
        username: `casc-${suffix}`,
        password: "Secret123!",
        name: "Cascade",
        role: "colaborator",
        code: Number(suffix.slice(-5)),
      });
      const db = getDb();
      const august = await getOrCreateMonthlyBalance(
        {
          userId: colaborator.id,
          currencyPluralTitle: "Estrelas",
          now: new Date("2026-08-05T12:00:00.000Z"),
        },
        db,
      );
      const september = await getOrCreateMonthlyBalance(
        {
          userId: colaborator.id,
          currencyPluralTitle: "Estrelas",
          now: new Date("2026-09-05T12:00:00.000Z"),
        },
        db,
      );
      const other = await getOrCreateMonthlyBalance(
        {
          userId: colaborator.id,
          currencyPluralTitle: "Pontos",
          now: new Date("2026-09-05T12:00:00.000Z"),
        },
        db,
      );
      await creditBalanceIncome({ balanceId: august.id, amount: 20 }, db);
      await creditBalanceIncome({ balanceId: september.id, amount: 10 }, db);
      await creditBalanceIncome({ balanceId: other.id, amount: 5 }, db);
      await db
        .update(balances)
        .set({ previousBalance: 99, balance: 104 })
        .where(eq(balances.id, other.id));

      await cascadeMonthlyBalances(
        {
          userId: colaborator.id,
          currencyPluralTitle: "Estrelas",
          from: new Date("2026-08-05T12:00:00.000Z"),
        },
        db,
      );

      const [starsSep] = await db
        .select()
        .from(balances)
        .where(eq(balances.id, september.id))
        .limit(1);
      const [pointsSep] = await db
        .select()
        .from(balances)
        .where(eq(balances.id, other.id))
        .limit(1);
      expect(starsSep?.previousBalance).toBe(20);
      expect(starsSep?.balance).toBe(30);
      expect(pointsSep?.previousBalance).toBe(99);
      expect(pointsSep?.balance).toBe(104);
    },
    45_000,
  );

  it(
    "reallocates a chain run across more than one colaborator",
    async () => {
      const suffix = String(Date.now());
      const db = getDb();
      const currency = await createCurrency({
        name: `ChainPay-${suffix}`,
        title: "Estrela",
        pluralTitle: "Estrelas",
        currencyPerSecond: 1,
      });
      await db.delete(currencyForSubtasks);
      await db.insert(currencyForSubtasks).values({ currencyId: currency.id });

      const worker = await createUser({
        username: `chainw-${suffix}`,
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
        code: `CR${suffix.slice(-6)}`,
        name: "Chain replay template",
        subTasks: [
          { name: "Cut", expectedTime: 10, index: 0 },
          {
            name: "Pack",
            expectedTime: 10,
            index: 1,
            linkedToPrevious: true,
            maxSameTimeWorkers: 2,
          },
        ],
      });
      const step = await createStep({ name: `ChainReplay ${suffix}`, index: 0 });
      const task = await createTask({
        name: `Chain replay ${suffix}`,
        qty: 1,
        stepId: step.id,
        templateTaskCode: `CR${suffix.slice(-6)}`,
      });
      const subs = await listSubTasksForTask(task.id);
      await assignColaboratorsToSubTask(subs[0]!.id, [worker.id]);
      await assignColaboratorsToSubTask(subs[1]!.id, [worker.id, helper.id]);

      const { chainRunId } = await startChain(
        worker.id,
        subs[0]!.id,
        undefined,
        new Date("2026-08-16T10:00:00.000Z"),
      );
      await startSubTask(
        helper.id,
        subs[1]!.id,
        undefined,
        new Date("2026-08-16T10:00:05.000Z"),
      );
      await confirmChainStop(
        worker.id,
        chainRunId,
        [
          { documentId: subs[0]!.id, completed: true },
          { documentId: subs[1]!.id, completed: true },
        ],
        undefined,
        new Date("2026-08-16T10:00:20.000Z"),
      );

      const before = await db
        .select({
          id: activities.id,
          colaboratorId: activities.colaboratorId,
          subTaskId: activities.subTaskId,
          action: activities.action,
          qty: activities.qty,
          currencyAwarded: activities.currencyAwarded,
        })
        .from(activities)
        .where(eq(activities.chainRunId, chainRunId));
      const beforeByUser = new Map<string, number>();
      for (const row of before) {
        beforeByUser.set(
          row.colaboratorId,
          (beforeByUser.get(row.colaboratorId) ?? 0) + row.currencyAwarded,
        );
      }
      expect(beforeByUser.size).toBeGreaterThanOrEqual(2);

      const stopToEdit =
        before.find(
          (row) => row.colaboratorId === helper.id && row.action === "stoped",
        ) ??
        before.find(
          (row) => row.colaboratorId === worker.id && row.action === "stoped",
        );
      expect(stopToEdit).toBeTruthy();

      await updateActivityFields(
        stopToEdit!.id,
        {
          colaboratorId: stopToEdit!.colaboratorId,
          subTaskId: stopToEdit!.subTaskId,
          action: "stoped",
          date: "2026-08-16",
          time: "08:30",
          qty: stopToEdit!.qty,
        },
        db,
      );

      const after = await db
        .select({
          colaboratorId: activities.colaboratorId,
          currencyAwarded: activities.currencyAwarded,
        })
        .from(activities)
        .where(eq(activities.chainRunId, chainRunId));
      const afterByUser = new Map<string, number>();
      for (const row of after) {
        afterByUser.set(
          row.colaboratorId,
          (afterByUser.get(row.colaboratorId) ?? 0) + row.currencyAwarded,
        );
      }
      expect(afterByUser.size).toBeGreaterThanOrEqual(2);
      expect(afterByUser.has(worker.id)).toBe(true);
      expect(afterByUser.has(helper.id)).toBe(true);
    },
    60_000,
  );
});
