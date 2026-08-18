import { Suspense } from "react";

import { auth } from "@/auth";
import { BoardLiveProgress } from "@/components/board/board-live-progress";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import { APP_BOARD_SHELL_CLASS } from "@/components/layout/app-page-layout";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
import { DEFAULT_ASSIGN_WARN_MAX } from "@/lib/business/assign-warn-max";
import { loadDrizzleBoardData } from "@/lib/board/load-board-data";
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

import {
  applyBoardTaskOrder,
  createBoardSubtask,
  loadBoardSubtasks,
  loadBoardSubtaskLive,
  loadBoardSubtaskSession,
  loadBoardSubtaskSessions,
  pollBoardProgress,
  releaseBoardSubTaskFlags,
  reorderBoardSubtasks,
  updateBoardSubtaskAssignees,
  updateBoardSubtaskLink,
} from "./actions";

async function loadBoard(): Promise<{ steps: KanbanStep[]; tasks: KanbanTask[] }> {
  return loadDrizzleBoardData();
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

function withProgressPending(tasks: KanbanTask[]): KanbanTask[] {
  return tasks.map((task) => {
    if (!shouldShowKanbanTaskProgress(task.status) || task.totalExpectedTime <= 0) {
      return task;
    }
    return { ...task, progressPending: true };
  });
}

async function withProgressLoaded(tasks: KanbanTask[]): Promise<{
  tasks: KanbanTask[];
  assignedCountByColaboratorId: Record<string, number>;
}> {
  const { progressByTaskId, badgesByTaskId, assignedCountByColaboratorId } =
    await loadBoardProgressByTaskId(tasks);
  const nowMs = Date.now();

  return {
    assignedCountByColaboratorId,
    tasks: tasks.map((task) => {
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
  };
}

function BoardCanvas({
  steps,
  tasks,
  teams,
  interactive,
  assignWarnMax,
  assignedCountByColaboratorId,
  paymentCurrency,
  assigneePeople,
}: {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
}) {
  return (
    <BoardLiveProgress
      tasks={tasks}
      steps={steps}
      teams={teams}
      interactive={interactive}
      assignWarnMax={assignWarnMax}
      assignedCountByColaboratorId={assignedCountByColaboratorId}
      paymentCurrency={paymentCurrency}
      assigneePeople={assigneePeople}
      pollBoardProgress={pollBoardProgress}
      applyBoardTaskOrder={applyBoardTaskOrder}
      loadSubtasks={loadBoardSubtasks}
      loadSubtaskLive={loadBoardSubtaskLive}
      loadSubtaskSessions={loadBoardSubtaskSessions}
      loadSubtaskSession={loadBoardSubtaskSession}
      reorderSubtasks={reorderBoardSubtasks}
      updateSubtaskAssignees={updateBoardSubtaskAssignees}
      linkSubtask={updateBoardSubtaskLink}
      createSubtask={createBoardSubtask}
      releaseSubtaskFlags={releaseBoardSubTaskFlags}
    />
  );
}

async function BoardWithProgress({
  steps,
  tasks,
  teams,
  interactive,
  assignWarnMax,
  paymentCurrency,
  assigneePeople,
}: {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
}) {
  const loaded = await withProgressLoaded(tasks);
  return (
    <BoardCanvas
      steps={steps}
      tasks={loaded.tasks}
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
  const [{ steps, tasks }, teams, automation, paymentCurrency, assigneePeople] =
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
          <BoardCanvas
            steps={steps}
            tasks={withProgressPending(tasks)}
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
          tasks={tasks}
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
