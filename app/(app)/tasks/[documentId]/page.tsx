import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import type {
  SubTaskRow,
  TeamAssignmentOption,
} from "@/components/subtasks/subtask-manager";
import { TaskDetailEditor } from "@/components/tasks/task-detail-editor";
import type { StepOption, TaskRow } from "@/components/tasks/task-manager";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTasks,
  canDeleteTasks,
  canManageTasks,
} from "@/lib/auth/permissions";
import { countFinishedSubTasksForTask } from "@/lib/business/task-subtask-completion-count";
import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";
import { listSteps } from "@/lib/repos/steps";
import {
  getTaskById,
  listSubTaskCompletionSnapshotsForTasks,
  listSubTasksWithRelationsForTask,
} from "@/lib/repos/tasks";
import { listTeamsWithMembers } from "@/lib/repos/teams";

import {
  createSubTask,
  deleteSubTask,
  loadSubTaskSessionsAction,
  reorderSubTasks,
  updateSubTask,
} from "./actions";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

async function loadTask(taskDocumentId: string): Promise<TaskRow | null> {
  try {
    const task = await getTaskById(taskDocumentId);
    if (!task) return null;
    let step: TaskRow["step"] = null;
    if (task.stepId) {
      const steps = await listSteps();
      const match = steps.find((row) => row.id === task.stepId);
      if (match) step = { documentId: match.id, name: match.name };
    }
    const completion = countFinishedSubTasksForTask(
      await listSubTaskCompletionSnapshotsForTasks([task.id]),
    );
    return {
      documentId: task.id,
      name: task.name,
      qty: task.qty,
      deliveryDate: task.deliveryDate,
      index: task.index,
      status: task.status,
      active: task.active,
      reasonForDeactivation: task.reasonForDeactivation ?? "",
      templateTaskCode: task.templateTaskCode,
      totalExpectedTime: task.totalExpectedTime,
      totalTimeSpent: task.totalTimeSpent,
      finishedSubTaskCount: completion.finishedCount,
      totalSubTaskCount: completion.totalCount,
      step,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}

async function loadSteps(): Promise<StepOption[]> {
  try {
    const steps = await listSteps();
    return steps.map((step) => ({
      documentId: step.id,
      name: step.name,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadSubTasks(taskDocumentId: string): Promise<SubTaskRow[]> {
  try {
    const rows = await listSubTasksWithRelationsForTask(taskDocumentId);
    return rows.map((subtask) => ({
      documentId: subtask.id,
      name: subtask.name,
      qty: subtask.qty,
      index: subtask.index,
      expectedTime: subtask.expectedTime,
      timeSpent: subtask.timeSpent ?? 0,
      sharingType: subtask.sharingType ?? "duration",
      maxSameTimeWorkers: subtask.maxSameTimeWorkers ?? 1,
      status: subtask.status,
      activationStatus: fromDrizzleActivationStatus(subtask.activationStatus),
      reasonForDisabling: subtask.reasonForDeactivation ?? "",
      dependencyIds: subtask.dependencyIds,
      assignedToIds: subtask.assignedToIds,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadTeamsForAssignment(): Promise<TeamAssignmentOption[]> {
  try {
    const teams = await listTeamsWithMembers();
    return teams
      .filter((team) => team.active)
      .map((team) => ({
        documentId: team.id,
        name: team.name,
        members: team.colaborators.map((colaborator) => ({
          documentId: colaborator.documentId,
          name: colaborator.name,
        })),
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
    values: Parameters<typeof createSubTask>[1],
    options?: { insertAtIndex?: number },
  ): Promise<void> {
    "use server";
    await createSubTask(documentId, values, options);
  }

  async function handleUpdateSubTask(
    subtaskDocumentId: string,
    values: Parameters<typeof updateSubTask>[2],
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

      <TaskDetailEditor
        task={task}
        steps={steps}
        subtasks={subtasks}
        teams={teams}
        canDeactivate={canDeactivateTasks(role)}
        canDelete={canDeleteTasks(role)}
        loadSessions={loadSubTaskSessionsAction}
        onCreateSubTask={handleCreate}
        onUpdateSubTask={handleUpdateSubTask}
        onReorderSubTasks={handleReorder}
        onDeleteSubTask={handleDeleteSubTask}
      />
    </section>
  );
}
