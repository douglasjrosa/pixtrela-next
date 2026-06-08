"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import type { TaskFormInput } from "@/lib/schemas/task";

import { TaskForm } from "./task-form";
import type { StepOption, TaskRow } from "./task-manager";

export interface TaskEditorProps {
  task: TaskRow;
  steps: StepOption[];
  onUpdate: (values: TaskFormInput) => void | Promise<void>;
}

function toFormValues(task: TaskRow): TaskFormInput {
  return {
    name: task.name,
    qty: task.qty,
    deliveryDate: task.deliveryDate ?? "",
    stepDocumentId: task.step?.documentId ?? "",
    status: task.status,
    templateTaskCode: task.templateTaskCode ?? "",
  };
}

export function TaskEditor({ task, steps, onUpdate }: TaskEditorProps) {
  const tManage = useTranslations("tasks.manage");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(values: TaskFormInput): void {
    startTransition(async () => {
      try {
        await onUpdate(values);
        setMessage(tManage("saved"));
      } catch {
        setMessage(tManage("error"));
      }
    });
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
      <TaskForm
        mode="edit"
        defaultValues={toFormValues(task)}
        steps={steps}
        metrics={{
          totalExpectedTime: task.totalExpectedTime,
          totalTimeSpent: task.totalTimeSpent,
          startedAt: task.startedAt,
          endedAt: task.endedAt,
        }}
        isPending={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
