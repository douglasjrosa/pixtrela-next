"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  deactivateTask,
  deleteTask,
  reactivateTask,
  updateTask,
} from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import type { TaskFormInput } from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import {
  SubTaskManager,
  type SubTaskCreateOptions,
  type SubTaskManagerHandle,
  type SubTaskRow,
  type TeamAssignmentOption,
} from "../subtasks/subtask-manager";
import { TaskForm } from "./task-form";
import type { StepOption, TaskRow } from "./task-manager";

const TASK_DETAIL_FORM_ID = "task-detail-form";

export interface TaskDetailEditorProps {
  task: TaskRow;
  steps: StepOption[];
  subtasks: SubTaskRow[];
  teams: TeamAssignmentOption[];
  canDeactivate: boolean;
  canDelete: boolean;
  onCreateSubTask: (
    values: SubTaskFormInput,
    options?: SubTaskCreateOptions,
  ) => void | Promise<void>;
  onUpdateSubTask: (
    documentId: string,
    values: SubTaskFormInput,
  ) => void | Promise<void>;
  onReorderSubTasks: (orderedDocumentIds: string[]) => void | Promise<void>;
  onDeleteSubTask: (documentId: string) => void | Promise<void>;
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function toFormValues(task: TaskRow, steps: StepOption[]): TaskFormInput {
  return {
    name: task.name,
    qty: task.qty,
    deliveryDate: toDateInputValue(task.deliveryDate),
    stepDocumentId:
      task.step?.documentId ?? resolveDefaultStepDocumentId(steps),
    status: task.status,
    templateTaskCode: task.templateTaskCode ?? "",
  };
}

export function TaskDetailEditor({
  task,
  steps,
  subtasks,
  teams,
  canDeactivate,
  canDelete,
  onCreateSubTask,
  onUpdateSubTask,
  onReorderSubTasks,
  onDeleteSubTask,
}: TaskDetailEditorProps) {
  const tCommon = useTranslations("common");
  const tManage = useTranslations("tasks.manage");
  const router = useRouter();
  const subtaskManagerRef = useRef<SubTaskManagerHandle>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function handleSubmit(values: TaskFormInput): void {
    startTransition(async () => {
      try {
        await updateTask(task.documentId, values);
        await subtaskManagerRef.current?.flushChanges();
        showSuccessToast(tManage("saved"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleInvalid(): void {
    showErrorToast(tManage("validationError"));
  }

  function handleDeactivate(reasonForDeactivation: string): void {
    startTransition(async () => {
      try {
        await deactivateTask(task.documentId, reasonForDeactivation);
        showSuccessToast(tManage("deactivated"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleReactivate(reasonForDeactivation: string): void {
    startTransition(async () => {
      try {
        await reactivateTask(task.documentId, reasonForDeactivation);
        showSuccessToast(tManage("reactivated"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleDeleteRequest(): void {
    setIsDeleteDialogOpen(true);
  }

  function handleDeleteConfirm(): void {
    setIsDeleteDialogOpen(false);
    startTransition(async () => {
      try {
        await deleteTask(task.documentId);
        showSuccessToast(tManage("deleted"));
        router.push("/tasks");
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  return (
    <div className="space-y-8 pb-24">
      <TaskForm
        mode="edit"
        formId={TASK_DETAIL_FORM_ID}
        hideActions
        defaultValues={toFormValues(task, steps)}
        isPending={isPending}
        active={task.active}
        reasonForDeactivation={task.reasonForDeactivation}
        canDeactivate={canDeactivate}
        canDelete={canDelete}
        onSubmit={handleSubmit}
        onInvalid={handleInvalid}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onDelete={handleDeleteRequest}
      />

      <SubTaskManager
        ref={subtaskManagerRef}
        subtasks={subtasks}
        taskQty={task.qty}
        teams={teams}
        disabled={isPending}
        onCreate={onCreateSubTask}
        onUpdate={onUpdateSubTask}
        onReorder={onReorderSubTasks}
        onDelete={onDeleteSubTask}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={tManage("deleteTitle")}
        description={tManage("deleteConfirm")}
        confirmLabel={tManage("delete")}
        disabled={isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteDialogOpen(false)}
      />

      <div className="fixed right-6 bottom-6 z-50">
        <Button
          type="submit"
          form={TASK_DETAIL_FORM_ID}
          size="lg"
          className="shadow-lg"
          disabled={isPending}
        >
          {tCommon("save")}
        </Button>
      </div>
    </div>
  );
}
