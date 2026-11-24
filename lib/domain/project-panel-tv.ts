const MS_PER_DAY = 86_400_000;

export const PANEL_DONE_TASK_STATUSES = [
  "finished",
  "reviewed",
  "delivered",
] as const;

export type PanelDoneTaskStatus = (typeof PANEL_DONE_TASK_STATUSES)[number];

export type LivePanelSubTask = {
  id: string;
  status: string;
  active: boolean;
};

export type LivePanelTask = {
  id: string;
  name: string;
  status: string;
  stepId: string | null;
  subTasks: readonly LivePanelSubTask[];
};

export type PanelTvCard = {
  id: string;
  name: string;
  status: string;
  producing: boolean;
  overrun: boolean;
  completedSubTasks: number;
  totalSubTasks: number;
};

export type FrozenPanelProjection = {
  today: PanelTvCard[];
  tomorrow: PanelTvCard[];
  completedTodayCount: number;
};

function isDoneStatus(status: string): boolean {
  return (PANEL_DONE_TASK_STATUSES as readonly string[]).includes(status);
}

export function isPanelTaskFulfilled(
  task: LivePanelTask | undefined,
  panelStepId: string,
): boolean {
  if (!task) return true;
  if (task.stepId !== panelStepId) return true;
  return isDoneStatus(task.status);
}

function addIsoDays(isoDate: string, days: number): string {
  const utc = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (!Number.isFinite(utc)) return isoDate;
  return new Date(utc + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function isImmediateNextDate(fromIso: string, toIso: string): boolean {
  return addIsoDays(fromIso, 1) === toIso;
}

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type PanelWeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function weekdayKeyFromIsoDate(isoDate: string): PanelWeekdayKey {
  const utc = Date.parse(`${isoDate}T12:00:00.000Z`);
  const index = Number.isFinite(utc) ? new Date(utc).getUTCDay() : 0;
  return WEEKDAY_KEYS[index] ?? "sunday";
}

function toCard(
  task: LivePanelTask,
  overrun: boolean,
): PanelTvCard {
  const active = task.subTasks.filter((subTask) => subTask.active);
  const completedSubTasks = active.filter(
    (subTask) => subTask.status === "finished",
  ).length;
  return {
    id: task.id,
    name: task.name,
    status: task.status,
    producing: task.status === "producing",
    overrun,
    completedSubTasks,
    totalSubTasks: active.length,
  };
}

function projectColumn(
  ids: readonly string[],
  tasksById: ReadonlyMap<string, LivePanelTask>,
  panelStepId: string,
  overrunTaskId: string | null,
): { cards: PanelTvCard[]; fulfilledCount: number } {
  const cards: PanelTvCard[] = [];
  let fulfilledCount = 0;
  for (const id of ids) {
    const task = tasksById.get(id);
    if (isPanelTaskFulfilled(task, panelStepId)) {
      fulfilledCount += 1;
      continue;
    }
    cards.push(toCard(task!, overrunTaskId === id));
  }
  return { cards, fulfilledCount };
}

export function projectFrozenPanelView(input: {
  todayIds: readonly string[];
  tomorrowIds: readonly string[];
  overrunTaskId: string | null;
  panelStepId: string;
  tasksById: ReadonlyMap<string, LivePanelTask>;
}): FrozenPanelProjection {
  const today = projectColumn(
    input.todayIds,
    input.tasksById,
    input.panelStepId,
    input.overrunTaskId,
  );
  const tomorrow = projectColumn(
    input.tomorrowIds,
    input.tasksById,
    input.panelStepId,
    null,
  );
  return {
    today: today.cards,
    tomorrow: tomorrow.cards,
    completedTodayCount: today.fulfilledCount,
  };
}
