"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { updateTask } from "@/app/(app)/tasks/actions";
import { resolveDefaultStepDocumentId } from "@/lib/business/default-task-step";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskFormInput } from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TaskForm } from "./task-form";
import type { StepOption, TaskRow } from "./task-manager";

export interface TaskEditorProps {
  task: TaskRow;
  steps: StepOption[];
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

export function TaskEditor({ task, steps }: TaskEditorProps) {
  const tManage = useTranslations("tasks.manage");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(values: TaskFormInput): void {
    startTransition(async () => {
      try {
        await updateTask(task.documentId, values);
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
    <TaskForm
      mode="edit"
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
  );
}
