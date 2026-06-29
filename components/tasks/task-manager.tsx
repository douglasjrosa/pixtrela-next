"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createTask,
  deactivateTask,
  deleteTask,
  updateTask,
} from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui/card";
import { Duration } from "@/components/ui/duration";
import { formatDatePtBr } from "@/lib/format/datetime";
import {
  buildCreateTaskFormDefaults,
  resolveDefaultStepDocumentId,
} from "@/lib/business/default-task-step";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskFormInput } from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TaskForm } from "./task-form";
import { TaskRowActions } from "./task-row-actions";

export interface StepOption {
  documentId: string;
  name: string;
}

export interface TaskRow {
  documentId: string;
  name: string;
  qty: number;
  deliveryDate?: string | null;
  index: number;
  status: TaskFormInput["status"];
  active: boolean;
  templateTaskCode?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  totalExpectedTime: number;
  totalTimeSpent: number;
  step?: { documentId: string; name: string } | null;
}

export interface TaskManagerProps {
  tasks: TaskRow[];
  steps: StepOption[];
  canDelete: boolean;
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

interface TaskFormDialogProps {
  editingTask: TaskRow | null;
  steps: StepOption[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormInput) => void;
  onInvalid: () => void;
}

function TaskFormDialog({
  editingTask,
  steps,
  isPending,
  onClose,
  onSubmit,
  onInvalid,
}: TaskFormDialogProps) {
  const formTitleId = "task-form-title";
  const isEditing = editingTask !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={formTitleId}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-4 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <TaskForm
          mode={isEditing ? "edit" : "create"}
          defaultValues={
            isEditing
              ? toFormValues(editingTask, steps)
              : buildCreateTaskFormDefaults(steps)
          }
          steps={steps}
          metrics={
            isEditing
              ? {
                  totalExpectedTime: editingTask.totalExpectedTime,
                  totalTimeSpent: editingTask.totalTimeSpent,
                  startedAt: editingTask.startedAt,
                  endedAt: editingTask.endedAt,
                }
              : undefined
          }
          layout="embedded"
          formTitleId={formTitleId}
          isPending={isPending}
          onSubmit={onSubmit}
          onInvalid={onInvalid}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

export function TaskManager({ tasks, steps, canDelete }: TaskManagerProps) {
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingTask =
    tasks.find((task) => task.documentId === editingTaskId) ?? null;

  function closeForm(): void {
    setFormOpen(false);
    setEditingTaskId(null);
  }

  function startCreate(): void {
    setEditingTaskId(null);
    setFormOpen(true);
  }

  function startEdit(task: TaskRow): void {
    setEditingTaskId(task.documentId);
    setFormOpen(true);
  }

  function handleSubmit(values: TaskFormInput): void {
    startTransition(async () => {
      try {
        if (editingTaskId !== null) {
          await updateTask(editingTaskId, values);
        } else {
          await createTask(values);
        }
        showSuccessToast(tManage("saved"));
        closeForm();
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

  function handleDeactivate(documentId: string): void {
    if (!window.confirm(tManage("deactivateConfirm"))) return;
    startTransition(async () => {
      try {
        await deactivateTask(documentId);
        showSuccessToast(tManage("deactivated"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  function handleDelete(documentId: string): void {
    if (!window.confirm(tManage("deleteConfirm"))) return;
    startTransition(async () => {
      try {
        await deleteTask(documentId);
        showSuccessToast(tManage("deleted"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("error"));
      }
    });
  }

  const formDialogKey = editingTaskId ?? "new";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tManage("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tManage("newTask")}
        </Button>
      </div>

      {formOpen ? (
        <TaskFormDialog
          key={formDialogKey}
          editingTask={editingTask}
          steps={steps}
          isPending={isPending}
          onClose={closeForm}
          onSubmit={handleSubmit}
          onInvalid={handleInvalid}
        />
      ) : null}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tManage("name")}</th>
            <th>{tManage("qty")}</th>
            <th>{tManage("deliveryDate")}</th>
            <th>{tManage("totalExpectedTime")}</th>
            <th>{tManage("totalTimeSpent")}</th>
            <th>{tManage("status")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.documentId} className="border-b">
              <td className="py-2">
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => startEdit(task)}
                >
                  {task.name}
                </button>
                {!task.active ? (
                  <CardBadge className="ml-2">{tManage("inactive")}</CardBadge>
                ) : null}
              </td>
              <td>{task.qty}</td>
              <td>{formatDatePtBr(task.deliveryDate)}</td>
              <td>
                <Duration seconds={task.totalExpectedTime} />
              </td>
              <td>
                <Duration seconds={task.totalTimeSpent} />
              </td>
              <td>{tStatus(task.status)}</td>
              <td className="space-x-2">
                <TaskRowActions
                  documentId={task.documentId}
                  active={task.active}
                  canDelete={canDelete}
                  onDeactivate={handleDeactivate}
                  onDelete={handleDelete}
                  pending={isPending}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
