import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  SubTaskManager,
  type SubTaskRow,
  type TeamAssignmentOption,
} from "@/components/subtasks/subtask-manager";
import { TaskEditor } from "@/components/tasks/task-editor";
import type { StepOption, TaskRow } from "@/components/tasks/task-manager";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks } from "@/lib/auth/permissions";
import { parseSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { TaskFormInput } from "@/lib/schemas/task";
import { ACTIVE_TEAM_FILTER } from "@/lib/business/team-active";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { createSubTask, deleteSubTask, reorderSubTasks, updateSubTask } from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface StrapiOne<T> {
  data: T;
}

interface TaskEntity {
  documentId: string;
  name: string;
  qty: number;
  deliveryDate?: string | null;
  index: number;
  status: TaskFormInput["status"];
  active?: boolean;
  templateTaskCode?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  totalExpectedTime?: number;
  totalTimeSpent?: number;
  step?: { documentId: string; name: string } | null;
}

interface StepEntity {
  documentId: string;
  name: string;
}

interface SubTaskEntity {
  documentId: string;
  name: string;
  qty: number;
  index: number;
  expectedTime: number;
  timeSpent: number;
  sharingType: SubTaskFormInput["sharingType"];
  maxSameTimeWorkers: number;
  status: SubTaskFormInput["status"];
  activationStatus?: SubTaskFormInput["activationStatus"];
  reasonForDisabling?: string | null;
  dependencies?: unknown;
  assignedTo?: { documentId: string }[] | null;
}

interface PageProps {
  params: Promise<{ documentId: string }>;
}

function mapTaskEntity(task: TaskEntity): TaskRow {
  return {
    documentId: task.documentId,
    name: task.name,
    qty: task.qty,
    deliveryDate: task.deliveryDate,
    index: task.index,
    status: task.status,
    active: task.active ?? true,
    templateTaskCode: task.templateTaskCode,
    startedAt: task.startedAt,
    endedAt: task.endedAt,
    totalExpectedTime: task.totalExpectedTime ?? 0,
    totalTimeSpent: task.totalTimeSpent ?? 0,
    step: task.step ?? null,
  };
}

async function loadTask(taskDocumentId: string): Promise<TaskRow | null> {
  try {
    const res = await strapiFetch<StrapiOne<TaskEntity>>(
      `/tasks/${taskDocumentId}`,
      { strapiCache: { tags: [STRAPI_TAGS.tasks], revalidate: 30 } },
      {
        fields: [
          "documentId",
          "name",
          "qty",
          "deliveryDate",
          "index",
          "status",
          "active",
          "templateTaskCode",
          "startedAt",
          "endedAt",
          "totalExpectedTime",
          "totalTimeSpent",
        ],
        populate: { step: { fields: ["documentId", "name"] } },
      },
    );
    return mapTaskEntity(res.data);
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}

async function loadSteps(): Promise<StepOption[]> {
  try {
    const res = await strapiFetch<StrapiList<StepEntity>>(
      "/steps",
      { strapiCache: { tags: [STRAPI_TAGS.steps], revalidate: 60 } },
      { fields: ["documentId", "name"], sort: "index:asc" },
    );
    return res.data.map((step) => ({
      documentId: step.documentId,
      name: step.name,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadSubTasks(taskDocumentId: string): Promise<SubTaskRow[]> {
  try {
    const res = await strapiFetch<StrapiList<SubTaskEntity>>(
      "/sub-tasks",
      { strapiCache: { tags: [STRAPI_TAGS.subTasks], revalidate: 30 } },
      {
        fields: [
          "documentId",
          "name",
          "qty",
          "index",
          "expectedTime",
          "timeSpent",
          "sharingType",
          "maxSameTimeWorkers",
          "status",
          "activationStatus",
          "reasonForDisabling",
          "dependencies",
        ],
        filters: { task: { documentId: { $eq: taskDocumentId } } },
        populate: { assignedTo: { fields: ["documentId"] } },
        sort: "index:asc",
      },
    );
    return res.data.map((subtask) => ({
      documentId: subtask.documentId,
      name: subtask.name,
      qty: subtask.qty,
      index: subtask.index,
      expectedTime: subtask.expectedTime,
      timeSpent: subtask.timeSpent ?? 0,
      sharingType: subtask.sharingType ?? "duration",
      maxSameTimeWorkers: subtask.maxSameTimeWorkers ?? 1,
      status: subtask.status,
      activationStatus: subtask.activationStatus ?? "locked",
      reasonForDisabling: subtask.reasonForDisabling ?? "",
      dependencyIds: parseSubTaskDependencyIds(subtask.dependencies),
      assignedToIds: subtask.assignedTo?.map((user) => user.documentId) ?? [],
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

interface TeamEntity {
  documentId: string;
  name: string;
  colaborators?: { documentId: string; name?: string }[] | null;
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

export default async function TaskDetailPage({ params }: PageProps) {
  const { documentId } = await params;
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const tCommon = await getTranslations("common");
  const tManage = await getTranslations("tasks.manage");

  if (!canManageTasks(role)) {
    return <ForbiddenMessage />;
  }

  const [task, steps, subtasks, teams] = await Promise.all([
    loadTask(documentId),
    loadSteps(),
    loadSubTasks(documentId),
    loadTeamsForAssignment(),
  ]);

  if (!task) {
    return (
      <section className="space-y-4 p-6">
        <Link href="/tasks" className="text-sm hover:underline">
          {tCommon("back")}
        </Link>
        <p className="text-destructive">{tManage("error")}</p>
      </section>
    );
  }

  async function handleCreate(
    values: SubTaskFormInput,
    options?: { insertAtIndex?: number },
  ): Promise<void> {
    "use server";
    await createSubTask(documentId, values, options);
  }

  async function handleUpdateSubTask(
    subtaskDocumentId: string,
    values: SubTaskFormInput,
  ): Promise<void> {
    "use server";
    await updateSubTask(subtaskDocumentId, documentId, values);
  }

  async function handleReorder(orderedDocumentIds: string[]): Promise<void> {
    "use server";
    await reorderSubTasks(documentId, orderedDocumentIds);
  }

  async function handleDeleteSubTask(subtaskDocumentId: string): Promise<void> {
    "use server";
    await deleteSubTask(subtaskDocumentId);
  }

  return (
    <section className="space-y-8 p-6">
      <Link href="/tasks" className="text-sm hover:underline">
        {tCommon("back")}
      </Link>

      <TaskEditor task={task} steps={steps} />

      <SubTaskManager
        subtasks={subtasks}
        taskQty={task.qty}
        teams={teams}
        onCreate={handleCreate}
        onUpdate={handleUpdateSubTask}
        onReorder={handleReorder}
        onDelete={handleDeleteSubTask}
      />
    </section>
  );
}
