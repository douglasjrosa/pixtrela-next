import { Suspense } from "react";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { BoardActions } from "@/components/board/board-actions";
import { BoardLiveProgress } from "@/components/board/board-live-progress";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
import { loadBoardProgressByTaskId } from "@/lib/board/load-board-progress";
import {
  needsLiveBoardProgress,
  shouldShowKanbanTaskProgress,
} from "@/lib/business/task-progress";
import { ACTIVE_TEAM_FILTER } from "@/lib/business/team-active";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

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
    // Finished: no live fetch — show bar from persisted totals immediately.
    if (!needsLiveBoardProgress(task.status)) {
      return {
        ...task,
        progressPending: false,
        progressInput: { subTasks: [], openActivityStartedAts: [] },
        progressNowMs: Date.now(),
      };
    }
    return { ...task, progressPending: true };
  });
}

async function withProgressLoaded(tasks: KanbanTask[]): Promise<KanbanTask[]> {
  const progressByTaskId = await loadBoardProgressByTaskId(tasks);
  const nowMs = Date.now();

  return tasks.map((task) => {
    if (!shouldShowKanbanTaskProgress(task.status) || task.totalExpectedTime <= 0) {
      return task;
    }
    if (!needsLiveBoardProgress(task.status)) {
      return {
        ...task,
        progressPending: false,
        progressInput: { subTasks: [], openActivityStartedAts: [] },
        progressNowMs: nowMs,
      };
    }
    return {
      ...task,
      progressPending: false,
      progressInput: progressByTaskId[task.documentId] ?? {
        subTasks: [],
        openActivityStartedAts: [],
      },
      progressNowMs: nowMs,
    };
  });
}

function BoardCanvas({
  steps,
  tasks,
  teams,
  interactive,
}: {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
}) {
  return (
    <BoardLiveProgress tasks={tasks} pollBoardProgress={pollBoardProgress}>
      {(liveTasks) =>
        interactive ? (
          <BoardActions
            steps={steps}
            tasks={liveTasks}
            teams={teams}
            applyBoardTaskOrder={applyBoardTaskOrder}
            loadSubtasks={loadBoardSubtasks}
            updateSubtaskAssignees={updateBoardSubtaskAssignees}
            createSubtask={createBoardSubtask}
          />
        ) : (
          <KanbanBoard steps={steps} tasks={liveTasks} />
        )
      }
    </BoardLiveProgress>
  );
}

async function BoardWithProgress({
  steps,
  tasks,
  teams,
  interactive,
}: {
  steps: KanbanStep[];
  tasks: KanbanTask[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
}) {
  const tasksWithProgress = await withProgressLoaded(tasks);
  return (
    <BoardCanvas
      steps={steps}
      tasks={tasksWithProgress}
      teams={teams}
      interactive={interactive}
    />
  );
}

export default async function BoardPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const interactive = canMoveBoardTasks(role);
  const [{ steps, tasks }, teams] = await Promise.all([
    loadBoard(),
    interactive ? loadTeamsForAssignment() : Promise.resolve([]),
  ]);

  return (
    <Suspense
      fallback={
        <BoardCanvas
          steps={steps}
          tasks={withProgressPending(tasks)}
          teams={teams}
          interactive={interactive}
        />
      }
    >
      <BoardWithProgress
        steps={steps}
        tasks={tasks}
        teams={teams}
        interactive={interactive}
      />
    </Suspense>
  );
}
