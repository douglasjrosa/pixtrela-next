"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { updateTask } from "@/app/(app)/tasks/actions";
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
import { Button } from "@/components/ui/button";

const TASK_DETAIL_FORM_ID = "task-detail-form";

export interface TaskDetailEditorProps {
  task: TaskRow;
  steps: StepOption[];
  subtasks: SubTaskRow[];
  teams: TeamAssignmentOption[];
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

  return (
    <div className="space-y-8 pb-24">
      <TaskForm
        mode="edit"
        formId={TASK_DETAIL_FORM_ID}
        hideActions
        defaultValues={toFormValues(task, steps)}
        steps={steps}
        metrics={{
          totalExpectedTime: task.totalExpectedTime,
          totalTimeSpent: task.totalTimeSpent,
          startedAt: task.startedAt,
          endedAt: task.endedAt,
        }}
        isPending={isPending}
        onSubmit={handleSubmit}
        onInvalid={handleInvalid}
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
