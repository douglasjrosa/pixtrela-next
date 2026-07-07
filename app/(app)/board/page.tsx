import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { BoardActions } from "@/components/board/board-actions";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
import { ACTIVE_TEAM_FILTER } from "@/lib/business/team-active";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import {
  applyBoardTaskOrder,
  createBoardSubtask,
  loadBoardSubtasks,
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
  status: KanbanTask["status"];
  index: number;
  deliveryDate?: string | null;
  step?: { id: number } | null;
}

interface TeamEntity {
  documentId: string;
  name: string;
  colaborators?: { documentId: string; name?: string }[] | null;
}

const BOARD_REVALIDATE_SEC = 30;

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
          fields: ["documentId", "name", "status", "index", "deliveryDate"],
          filters: { active: { $eq: true } },
          populate: { step: { fields: ["id"] } },
          sort: "index:asc",
        },
      ),
    ]);
    return {
      steps: stepsRes.data.map((step) => ({ id: step.id, name: step.name })),
      tasks: tasksRes.data.map((task) => ({
        id: task.id,
        documentId: task.documentId,
        name: task.name,
        status: task.status,
        stepId: task.step?.id ?? null,
        index: task.index,
        deliveryDate: task.deliveryDate ?? null,
      })),
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

export default async function BoardPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const { steps, tasks } = await loadBoard();

  if (canMoveBoardTasks(role)) {
    const teams = await loadTeamsForAssignment();
    return (
      <>
        <BoardActions
          steps={steps}
          tasks={tasks}
          teams={teams}
          applyBoardTaskOrder={applyBoardTaskOrder}
          loadSubtasks={loadBoardSubtasks}
          updateSubtaskAssignees={updateBoardSubtaskAssignees}
          createSubtask={createBoardSubtask}
        />
      </>
    );
  }

  const { KanbanBoard } = await import("@/components/kanban/kanban-board");
  return <KanbanBoard steps={steps} tasks={tasks} />;
}
