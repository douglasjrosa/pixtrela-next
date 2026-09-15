import type { KanbanStep } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { DEFAULT_ASSIGN_WARN_MAX } from "@/lib/business/assign-warn-max";
import {
  loadDrizzleBoardData,
  type BoardColumnPage,
} from "@/lib/board/load-board-data";
import { loadBoardProgressByTaskId } from "@/lib/board/load-board-progress";
import { shouldShowKanbanTaskProgress } from "@/lib/business/task-progress";
import { listTeamsWithMembers } from "@/lib/repos/teams";
import { listUserAssigneeNames } from "@/lib/repos/users";
import {
  loadCurrencyForSubtasks,
  toSubtaskPaymentCurrency,
  type SubtaskPaymentCurrency,
} from "@/lib/settings/load-currency-for-subtasks";
import { loadTaskAutomationSetting } from "@/lib/settings/load-task-automation";

/** Shared board page props consumed by the app and kiosk staff board pages. */
export interface BoardPageData {
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  teams: TeamAssignmentOption[];
  assignWarnMax: number;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
}

async function loadBoardColumns(): Promise<{
  steps: KanbanStep[];
  columns: BoardColumnPage[];
}> {
  const data = await loadDrizzleBoardData();
  return { steps: data.steps, columns: data.columns };
}

/** Assignee picker teams: a leader sees only their teams; manager+ see all. */
async function loadTeamsForAssignment(
  leaderId?: string | null,
): Promise<TeamAssignmentOption[]> {
  const rows = await listTeamsWithMembers();
  return rows
    .filter((team) => team.active)
    .filter((team) => !leaderId || team.leaderId === leaderId)
    .map((team) => ({
      documentId: team.id,
      name: team.name,
      members: team.colaborators,
    }));
}

export async function loadBoardPageData(options: {
  interactive: boolean;
  teamsLeaderId?: string | null;
}): Promise<BoardPageData> {
  const { interactive, teamsLeaderId } = options;
  const [
    { steps, columns },
    teams,
    automation,
    currencySetting,
    assigneePeople,
  ] = await Promise.all([
    loadBoardColumns(),
    interactive
      ? loadTeamsForAssignment(teamsLeaderId)
      : Promise.resolve<TeamAssignmentOption[]>([]),
    loadTaskAutomationSetting(),
    loadCurrencyForSubtasks(),
    interactive
      ? listUserAssigneeNames()
      : Promise.resolve<{ documentId: string; name: string }[]>([]),
  ]);

  return {
    steps,
    columns,
    teams,
    assignWarnMax: automation.assignWarnMax ?? DEFAULT_ASSIGN_WARN_MAX,
    paymentCurrency: toSubtaskPaymentCurrency(currencySetting),
    assigneePeople,
  };
}

export function withBoardProgressPending(
  columns: BoardColumnPage[],
): BoardColumnPage[] {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => {
      if (
        !shouldShowKanbanTaskProgress(task.status) ||
        task.totalExpectedTime <= 0
      ) {
        return task;
      }
      return { ...task, progressPending: true };
    }),
  }));
}

export async function withBoardProgressLoaded(columns: BoardColumnPage[]): Promise<{
  columns: BoardColumnPage[];
  assignedCountByColaboratorId: Record<string, number>;
}> {
  const tasks = columns.flatMap((column) => column.tasks);
  const { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId } =
    await loadBoardProgressByTaskId(tasks);
  const nowMs = Date.now();

  return {
    assignedCountByColaboratorId,
    columns: columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) => {
        const badges = badgesByTaskId[task.documentId];
        const badgeFields = {
          activeColaboratorCount: badges?.activeColaboratorCount ?? 0,
          unassignedSubTaskCount: badges?.unassignedSubTaskCount ?? 0,
          participantCount: badges?.participantCount ?? 0,
        };

        if (
          !shouldShowKanbanTaskProgress(task.status) ||
          task.totalExpectedTime <= 0
        ) {
          return { ...task, ...badgeFields };
        }
        return {
          ...task,
          ...badgeFields,
          progressPending: false,
          progressInput: progressByTaskId[task.documentId] ?? {
            subTasks: [],
            openActivityStartedAts: [],
          },
          progressNowMs: nowMs,
        };
      }),
    })),
  };
}
