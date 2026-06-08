import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { BoardActions } from "@/components/board/board-actions";
import type { KanbanStep, KanbanTask } from "@/components/kanban/types";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { moveTaskToStep } from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface StepEntity {
  id: number;
  name: string;
}

interface TaskEntity {
  id: number;
  name: string;
  status: KanbanTask["status"];
  step?: { id: number } | null;
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
          fields: ["name", "status"],
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
        name: task.name,
        status: task.status,
        stepId: task.step?.id ?? null,
      })),
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return { steps: [], tasks: [] };
  }
}

export default async function BoardPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const { steps, tasks } = await loadBoard();

  if (canMoveBoardTasks(role)) {
    return <BoardActions steps={steps} tasks={tasks} moveTask={moveTaskToStep} />;
  }

  const { KanbanBoard } = await import("@/components/kanban/kanban-board");
  return <KanbanBoard steps={steps} tasks={tasks} />;
}
