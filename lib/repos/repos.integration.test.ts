import { afterAll, beforeAll, expect, it } from "vitest";

import { closeDb, getDb } from "@/lib/db/client";
import { describeWithDb } from "@/lib/db/test-utils";
import { createAward, createCurrency } from "@/lib/repos/awards";
import {
  creditBalanceIncome,
  getOrCreateMonthlyBalance,
} from "@/lib/repos/balances";
import { redeemAward } from "@/lib/repos/exchanges";
import { identifyColaboratorByCode } from "@/lib/repos/kiosk";
import { createStep, listSteps } from "@/lib/repos/steps";
import { createTask, listSubTasksForTask, recordActivity } from "@/lib/repos/tasks";
import { createTeam } from "@/lib/repos/teams";
import { createTemplateTask } from "@/lib/repos/templates";
import { createUser } from "@/lib/repos/users";
import { currencies, currencyForSubtasks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

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

  it("redeems award inside exchange window with debit", async () => {
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
      prices: [{ currencyId: currency.id, numberOf: 5 }],
    });

    const balance = await getOrCreateMonthlyBalance({
      userId: colaborator.id,
      currencyId: currency.id,
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
  });

  it("copies template subtasks and credits stars on stop", async () => {
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
      timestamp: stoppedAt,
    });
    expect(stop.currencyAwarded).toBe(30);

    const identified = await identifyColaboratorByCode({
      code: colaborator.code,
      password: "Secret123!",
    });
    expect(identified?.id).toBe(colaborator.id);

    // keep currency row for FK sanity
    const [stillThere] = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, currency.id))
      .limit(1);
    expect(stillThere).toBeTruthy();
  });
});
