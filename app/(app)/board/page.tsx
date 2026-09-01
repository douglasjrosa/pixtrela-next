import { Suspense } from "react";

import { auth } from "@/auth";
import { BoardPageCanvas } from "@/components/board/board-page-canvas";
import type { KanbanStep } from "@/components/kanban/types";
import { APP_BOARD_SHELL_CLASS } from "@/components/layout/app-page-layout";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
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

async function loadBoard(): Promise<{
  steps: KanbanStep[];
  columns: BoardColumnPage[];
}> {
  const data = await loadDrizzleBoardData();
  return { steps: data.steps, columns: data.columns };
}

async function loadTeamsForAssignment(): Promise<TeamAssignmentOption[]> {
  const rows = await listTeamsWithMembers();
  return rows
    .filter((team) => team.active)
    .map((team) => ({
      documentId: team.id,
      name: team.name,
      members: team.colaborators,
    }));
}

async function loadBoardPaymentCurrency(): Promise<SubtaskPaymentCurrency> {
  const setting = await loadCurrencyForSubtasks();
  return toSubtaskPaymentCurrency(setting);
}

function withProgressPending(columns: BoardColumnPage[]): BoardColumnPage[] {
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

async function withProgressLoaded(columns: BoardColumnPage[]): Promise<{
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

async function BoardWithProgress({
  steps,
  columns,
  teams,
  interactive,
  assignWarnMax,
  paymentCurrency,
  assigneePeople,
}: {
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
}) {
  const loaded = await withProgressLoaded(columns);
  return (
    <BoardPageCanvas
      steps={steps}
      columns={loaded.columns}
      teams={teams}
      interactive={interactive}
      assignWarnMax={assignWarnMax}
      assignedCountByColaboratorId={loaded.assignedCountByColaboratorId}
      paymentCurrency={paymentCurrency}
      assigneePeople={assigneePeople}
    />
  );
}

export default async function BoardPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const interactive = canMoveBoardTasks(role);
  const [{ steps, columns }, teams, automation, paymentCurrency, assigneePeople] =
    await Promise.all([
      loadBoard(),
      interactive ? loadTeamsForAssignment() : Promise.resolve([]),
      loadTaskAutomationSetting(),
      loadBoardPaymentCurrency(),
      interactive ? listUserAssigneeNames() : Promise.resolve([]),
    ]);
  const assignWarnMax = automation.assignWarnMax ?? DEFAULT_ASSIGN_WARN_MAX;

  return (
    <div className={APP_BOARD_SHELL_CLASS}>
      <Suspense
        fallback={
          <BoardPageCanvas
            steps={steps}
            columns={withProgressPending(columns)}
            teams={teams}
            interactive={interactive}
            assignWarnMax={assignWarnMax}
            assignedCountByColaboratorId={{}}
            paymentCurrency={paymentCurrency}
            assigneePeople={assigneePeople}
          />
        }
      >
        <BoardWithProgress
          steps={steps}
          columns={columns}
          teams={teams}
          interactive={interactive}
          assignWarnMax={assignWarnMax}
          paymentCurrency={paymentCurrency}
          assigneePeople={assigneePeople}
        />
      </Suspense>
    </div>
  );
}
