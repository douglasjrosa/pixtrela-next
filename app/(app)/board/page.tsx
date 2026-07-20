import { Suspense } from "react";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { BoardLiveProgress } from "@/components/board/board-live-progress";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import { APP_BOARD_SHELL_CLASS } from "@/components/layout/app-page-layout";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
import { DEFAULT_ASSIGN_WARN_MAX } from "@/lib/business/assign-warn-max";
import { loadBoardProgressByTaskId } from "@/lib/board/load-board-progress";
import {
  shouldShowKanbanTaskProgress,
} from "@/lib/business/task-progress";
import { ACTIVE_TEAM_FILTER } from "@/lib/business/team-active";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import {
  loadCurrencyForSubtasks,
  toSubtaskPaymentCurrency,
  type SubtaskPaymentCurrency,
} from "@/lib/strapi/currency-for-subtasks";
import { loadTaskAutomationSetting } from "@/lib/strapi/task-automation-setting";

import {
  applyBoardTaskOrder,
  createBoardSubtask,
  loadBoardSubtasks,
  pollBoardProgress,
  updateBoardSubtaskAssignees,
} from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface StepEntity {
  id: number;
  name: string;
}

interface TaskEntity {
  id: number;
  documentId: string;
  name: string;
  qty: number;
  status: KanbanTask["status"];
  index: number;
  deliveryDate?: string | null;
  endedAt?: string | null;
  totalExpectedTime?: number;
  totalTimeSpent?: number;
  step?: { id: number } | null;
}

interface TeamEntity {
  documentId: string;
  name: string;
  colaborators?: { documentId: string; name?: string }[] | null;
}

const BOARD_REVALIDATE_SEC = 30;

function mapTaskEntity(task: TaskEntity): KanbanTask {
  return {
    id: task.id,
    documentId: task.documentId,
    name: task.name,
    qty: task.qty,
    status: task.status,
    stepId: task.step?.id ?? null,
    index: task.index,
    deliveryDate: task.deliveryDate ?? null,
    endedAt: task.endedAt ?? null,
    totalExpectedTime: task.totalExpectedTime ?? 0,
    totalTimeSpent: task.totalTimeSpent ?? 0,
  };
}

async function loadBoard(): Promise<{ steps: KanbanStep[]; tasks: KanbanTask[] }> {
  try {
    const [stepsRes, tasksRes] = await Promise.all([
      strapiFetch<StrapiList<StepEntity>>(
        "/steps",
        { strapiCache: { tags: [STRAPI_TAGS.steps], revalidate: BOARD_REVALIDATE_SEC } },
        { fields: ["name"], sort: "index:asc" },
      ),
      strapiFetch<StrapiList<TaskEntity>>(
        "/tasks",
        { strapiCache: { tags: [STRAPI_TAGS.tasks], revalidate: BOARD_REVALIDATE_SEC } },
        {
          fields: [
            "documentId",
            "name",
            "qty",
            "status",
            "index",
            "deliveryDate",
            "endedAt",
            "totalExpectedTime",
            "totalTimeSpent",
          ],
          filters: { active: { $eq: true } },
          populate: { step: { fields: ["id"] } },
          sort: "index:asc",
        },
      ),
    ]);
    return {
      steps: stepsRes.data.map((step) => ({ id: step.id, name: step.name })),
      tasks: tasksRes.data.map(mapTaskEntity),
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return { steps: [], tasks: [] };
  }
}

async function loadTeamsForAssignment(): Promise<TeamAssignmentOption[]> {
  try {
    const res = await strapiFetch<StrapiList<TeamEntity>>(
      "/teams",
      { strapiCache: { tags: [STRAPI_TAGS.teams], revalidate: 60 } },
      {
        fields: ["documentId", "name"],
        filters: ACTIVE_TEAM_FILTER,
        populate: { colaborators: { fields: ["documentId", "name"] } },
        sort: "name:asc",
      },
    );
    return res.data.map((team) => ({
      documentId: team.documentId,
      name: team.name,
      members:
        team.colaborators?.map((colaborator) => ({
          documentId: colaborator.documentId,
          name: colaborator.name ?? "",
        })) ?? [],
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
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
}: {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  assignedCountByColaboratorId: Record<string, number>;
  paymentCurrency: SubtaskPaymentCurrency;
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
      pollBoardProgress={pollBoardProgress}
      applyBoardTaskOrder={applyBoardTaskOrder}
      loadSubtasks={loadBoardSubtasks}
      updateSubtaskAssignees={updateBoardSubtaskAssignees}
      createSubtask={createBoardSubtask}
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
}: {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  paymentCurrency: SubtaskPaymentCurrency;
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
    />
  );
}

export default async function BoardPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const interactive = canMoveBoardTasks(role);
  const [{ steps, tasks }, teams, automation, paymentSetting] =
    await Promise.all([
      loadBoard(),
      interactive ? loadTeamsForAssignment() : Promise.resolve([]),
      loadTaskAutomationSetting(),
      loadCurrencyForSubtasks(),
    ]);
  const assignWarnMax = automation.assignWarnMax ?? DEFAULT_ASSIGN_WARN_MAX;
  const paymentCurrency = toSubtaskPaymentCurrency(paymentSetting);

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
        />
      </Suspense>
    </div>
  );
}
