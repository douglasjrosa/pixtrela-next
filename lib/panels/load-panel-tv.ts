import { and, eq, inArray } from "drizzle-orm";

import {
  activities,
  subTaskAssignees,
  subTasks,
  tasks,
} from "@/drizzle/schema";
import { sumStoppedQtyBySubTaskId } from "@/lib/business/kiosk-subtask-map";
import { compareTasksForStepOrder } from "@/lib/business/step-task-order";
import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import { getDb, type Db } from "@/lib/db/client";
import {
  findNextBusinessDate,
  packPanelTasks,
  type PanelTaskInput,
} from "@/lib/domain/panel-pack";
import {
  civilDayRangeMs,
  resolveProductiveWindows,
  type ProductiveWindow,
  type WorkdayCoverageRule,
} from "@/lib/domain/workday-coverage";
import { resolveSubTaskTargetQty } from "@/lib/domain/work-currency";
import {
  isImmediateNextDate,
  projectFrozenPanelView,
  weekdayKeyFromIsoDate,
  type LivePanelTask,
  type PanelTvCard,
  type PanelWeekdayKey,
} from "@/lib/domain/project-panel-tv";
import {
  findActivePanelBySlug,
  listActivePanels,
  listUserIdsForTeams,
  type PanelListRow,
} from "@/lib/repos/panels";
import {
  getOrCreatePanelShiftSnapshot,
  type InsertPanelShiftSnapshotInput,
  type PanelShiftSnapshotRecord,
} from "@/lib/repos/panel-snapshots";
import { getStepById } from "@/lib/repos/steps";
import { loadWorkdayRulesForUsers } from "@/lib/repos/workday-coverage";
import { DEFAULT_WORKDAY_TIMEZONE } from "@/lib/schemas/workday";
import type { StepTaskOrderBy } from "@/lib/schemas/step-task-order-by";

const NEXT_BUSINESS_DAY_LOOKAHEAD = 31;
const MS_PER_DAY = 86_400_000;

export type ProductionTvView = {
  panelName: string;
  slug: string;
  stepName: string;
  businessDate: string;
  nextBusinessDate: string | null;
  nextDayKind: "tomorrow" | "weekday";
  nextWeekdayKey: PanelWeekdayKey | null;
  today: PanelTvCard[];
  tomorrow: PanelTvCard[];
  completedTodayCount: number;
};

type StepTaskRow = {
  id: string;
  name: string;
  status: string;
  stepId: string | null;
  index: number;
  deliveryDate: string | null;
  createdAt: Date;
};

function mergeUsableMaps(
  items: readonly { usableTodayBySubTask: Record<string, number> }[],
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const item of items) {
    Object.assign(merged, item.usableTodayBySubTask);
  }
  return merged;
}

function windowsByUser(
  userIds: readonly string[],
  rulesByUserId: ReadonlyMap<string, WorkdayCoverageRule[]>,
  start: Date,
  end: Date,
): Map<string, ProductiveWindow[]> {
  const labor = new Map<string, ProductiveWindow[]>();
  for (const userId of userIds) {
    labor.set(
      userId,
      resolveProductiveWindows(start, end, rulesByUserId.get(userId) ?? []),
    );
  }
  return labor;
}

async function listActiveTasksOnStep(
  stepId: string,
  orderBy: StepTaskOrderBy,
  db: Db,
): Promise<StepTaskRow[]> {
  const rows = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      status: tasks.status,
      stepId: tasks.stepId,
      index: tasks.index,
      deliveryDate: tasks.deliveryDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(and(eq(tasks.active, true), eq(tasks.stepId, stepId)));
  const normalized = rows.map((row) => ({
    ...row,
    deliveryDate: row.deliveryDate
      ? String(row.deliveryDate).slice(0, 10)
      : null,
  }));
  return [...normalized].sort((left, right) =>
    compareTasksForStepOrder(left, right, orderBy),
  );
}

async function loadSubTasksForTasks(
  taskIds: readonly string[],
  db: Db,
): Promise<
  Array<{
    id: string;
    taskId: string;
    status: string;
    active: boolean;
    sharingType: "qty" | "duration";
    expectedTime: number;
    timeSpent: number;
    qty: number;
    maxSameTimeWorkers: number;
    assignedToIds: string[];
  }>
> {
  if (taskIds.length === 0) return [];
  const rows = await db
    .select({
      id: subTasks.id,
      taskId: subTasks.taskId,
      status: subTasks.status,
      active: subTasks.active,
      sharingType: subTasks.sharingType,
      expectedTime: subTasks.expectedTime,
      timeSpent: subTasks.timeSpent,
      qty: subTasks.qty,
      maxSameTimeWorkers: subTasks.maxSameTimeWorkers,
    })
    .from(subTasks)
    .where(inArray(subTasks.taskId, [...taskIds]));

  if (rows.length === 0) return [];
  const assigneeRows = await db
    .select({
      subTaskId: subTaskAssignees.subTaskId,
      userId: subTaskAssignees.userId,
    })
    .from(subTaskAssignees)
    .where(
      inArray(
        subTaskAssignees.subTaskId,
        rows.map((row) => row.id),
      ),
    );
  const assigneesBySubTask = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const list = assigneesBySubTask.get(row.subTaskId) ?? [];
    list.push(row.userId);
    assigneesBySubTask.set(row.subTaskId, list);
  }
  return rows.map((row) => ({
    ...row,
    assignedToIds: assigneesBySubTask.get(row.id) ?? [],
  }));
}

async function loadStoppedQty(
  subTaskIds: readonly string[],
  db: Db,
): Promise<Map<string, number>> {
  if (subTaskIds.length === 0) return new Map();
  const rows = await db
    .select({
      subTaskId: activities.subTaskId,
      action: activities.action,
      qty: activities.qty,
    })
    .from(activities)
    .where(inArray(activities.subTaskId, [...subTaskIds]));
  return sumStoppedQtyBySubTaskId(rows);
}

function toPanelTaskInputs(
  orderedTasks: readonly StepTaskRow[],
  subTasksByTask: Map<
    string,
    Awaited<ReturnType<typeof loadSubTasksForTasks>>
  >,
  completedQtyById: ReadonlyMap<string, number>,
): PanelTaskInput[] {
  return orderedTasks.map((task) => ({
    id: task.id,
    subTasks: (subTasksByTask.get(task.id) ?? [])
      .filter((subTask) => subTask.active)
      .map((subTask) => ({
        id: subTask.id,
        assigneeIds: subTask.assignedToIds,
        maxSameTimeWorkers: subTask.maxSameTimeWorkers,
        sharingType: subTask.sharingType,
        expectedTime: subTask.expectedTime,
        targetQty: resolveSubTaskTargetQty(subTask.qty),
        completedQty: completedQtyById.get(subTask.id) ?? 0,
        timeSpent: subTask.timeSpent,
      })),
  }));
}

async function buildSnapshotInput(
  panel: PanelListRow,
  businessDate: string,
  timeZone: string,
  db: Db,
): Promise<InsertPanelShiftSnapshotInput> {
  const step = await getStepById(panel.stepId, db);
  const orderBy = step?.taskOrderBy ?? "manual";
  const orderedTasks = await listActiveTasksOnStep(panel.stepId, orderBy, db);
  const subTaskRows = await loadSubTasksForTasks(
    orderedTasks.map((task) => task.id),
    db,
  );
  const subTasksByTask = new Map<string, typeof subTaskRows>();
  for (const row of subTaskRows) {
    const list = subTasksByTask.get(row.taskId) ?? [];
    list.push(row);
    subTasksByTask.set(row.taskId, list);
  }
  const completedQtyById = await loadStoppedQty(
    subTaskRows.map((row) => row.id),
    db,
  );
  const packInputs = toPanelTaskInputs(
    orderedTasks,
    subTasksByTask,
    completedQtyById,
  );

  const assigneeIds = [
    ...new Set(subTaskRows.flatMap((row) => row.assignedToIds)),
  ];
  const teamUserIds = await listUserIdsForTeams(panel.teamIds, db);
  const userIds = [...new Set([...assigneeIds, ...teamUserIds])];
  const { startMs, endMs } = civilDayRangeMs(businessDate, timeZone);
  const rangeEnd = new Date(
    startMs + NEXT_BUSINESS_DAY_LOOKAHEAD * MS_PER_DAY,
  );
  const rulesByUserId = await loadWorkdayRulesForUsers(
    { userIds, from: new Date(startMs), to: rangeEnd },
    db,
  );
  const labor = windowsByUser(
    assigneeIds,
    rulesByUserId,
    new Date(startMs),
    new Date(endMs),
  );
  const packed = packPanelTasks(packInputs, labor, startMs, endMs);

  const nextBusinessDate = findNextBusinessDate(businessDate, (isoDate) => {
    const day = civilDayRangeMs(isoDate, timeZone);
    return teamUserIds.some((userId) => {
      const windows = resolveProductiveWindows(
        new Date(day.startMs),
        new Date(day.endMs),
        rulesByUserId.get(userId) ?? [],
      );
      return windows.length > 0;
    });
  });

  return {
    panelId: panel.id,
    businessDate,
    todayTaskIds: packed.today.map((item) => item.id),
    tomorrowTaskIds: packed.tomorrow.map((item) => item.id),
    overrunTaskId: packed.overrunTaskId,
    nextBusinessDate,
    usableTodayBySubTask: mergeUsableMaps([
      ...packed.today,
      ...packed.tomorrow,
    ]),
  };
}

async function loadLiveTasks(
  taskIds: readonly string[],
  db: Db,
): Promise<Map<string, LivePanelTask>> {
  const uniqueIds = [...new Set(taskIds.filter(Boolean))];
  const map = new Map<string, LivePanelTask>();
  if (uniqueIds.length === 0) return map;

  const rows = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      status: tasks.status,
      stepId: tasks.stepId,
    })
    .from(tasks)
    .where(inArray(tasks.id, uniqueIds));
  const subTaskRows = await loadSubTasksForTasks(
    rows.map((row) => row.id),
    db,
  );
  const subTasksByTask = new Map<string, LivePanelTask["subTasks"][number][]>();
  for (const row of subTaskRows) {
    const list = subTasksByTask.get(row.taskId) ?? [];
    list.push({
      id: row.id,
      status: row.status,
      active: row.active,
    });
    subTasksByTask.set(row.taskId, list);
  }
  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      name: row.name,
      status: row.status,
      stepId: row.stepId,
      subTasks: subTasksByTask.get(row.id) ?? [],
    });
  }
  return map;
}

function toView(
  panel: PanelListRow,
  snapshot: PanelShiftSnapshotRecord,
  tasksById: ReadonlyMap<string, LivePanelTask>,
): ProductionTvView {
  const projected = projectFrozenPanelView({
    todayIds: snapshot.todayTaskIds,
    tomorrowIds: snapshot.tomorrowTaskIds,
    overrunTaskId: snapshot.overrunTaskId,
    panelStepId: panel.stepId,
    tasksById,
  });
  const nextBusinessDate = snapshot.nextBusinessDate;
  const nextDayKind =
    nextBusinessDate &&
    isImmediateNextDate(snapshot.businessDate, nextBusinessDate)
      ? "tomorrow"
      : "weekday";
  return {
    panelName: panel.name,
    slug: panel.slug,
    stepName: panel.stepName,
    businessDate: snapshot.businessDate,
    nextBusinessDate,
    nextDayKind,
    nextWeekdayKey: nextBusinessDate
      ? weekdayKeyFromIsoDate(nextBusinessDate)
      : null,
    today: projected.today,
    tomorrow: projected.tomorrow,
    completedTodayCount: projected.completedTodayCount,
  };
}

export async function loadProductionTvBySlug(
  slug: string,
  now: Date = new Date(),
  db: Db = getDb(),
): Promise<ProductionTvView | null> {
  const panel = await findActivePanelBySlug(slug, db);
  if (!panel) return null;

  const timeZone = DEFAULT_WORKDAY_TIMEZONE;
  const businessDate = toCalendarDateKey(now, timeZone);
  const snapshot = await getOrCreatePanelShiftSnapshot(
    panel.id,
    businessDate,
    () => buildSnapshotInput(panel, businessDate, timeZone, db),
    db,
  );
  const tasksById = await loadLiveTasks(
    [...snapshot.todayTaskIds, ...snapshot.tomorrowTaskIds],
    db,
  );
  return toView(panel, snapshot, tasksById);
}

export async function listProductionTvHome(
  db: Db = getDb(),
): Promise<Array<{ name: string; slug: string; stepName: string }>> {
  const rows = await listActivePanels(db);
  return rows.map((row) => ({
    name: row.name,
    slug: row.slug,
    stepName: row.stepName,
  }));
}
