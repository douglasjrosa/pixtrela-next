"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createTask } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui/card";
import { Duration } from "@/components/ui/duration";
import { buildCreateTaskFormDefaults } from "@/lib/business/default-task-step";
import { formatDatePtBr } from "@/lib/format/datetime";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskFormInput } from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

import { TaskForm } from "./task-form";

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
  reasonForDeactivation?: string | null;
  templateTaskCode?: string | null;
  totalExpectedTime: number;
  totalTimeSpent: number;
  step?: { documentId: string; name: string } | null;
}

export interface TaskManagerProps {
  tasks: TaskRow[];
  steps: StepOption[];
}

interface CreateTaskDialogProps {
  steps: StepOption[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormInput) => void;
  onInvalid: () => void;
}

function CreateTaskDialog({
  steps,
  isPending,
  onClose,
  onSubmit,
  onInvalid,
}: CreateTaskDialogProps) {
  const tCommon = useTranslations("common");
  const formTitleId = "task-form-title";

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
        className={
          "relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg " +
          "border bg-background p-4 shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          disabled={isPending}
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>
        <TaskForm
          mode="create"
          defaultValues={buildCreateTaskFormDefaults(steps)}
          layout="embedded"
          formTitleId={formTitleId}
          isPending={isPending}
          onSubmit={onSubmit}
          onInvalid={onInvalid}
        />
      </div>
    </div>
  );
}

export function TaskManager({ tasks, steps }: TaskManagerProps) {
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function closeCreate(): void {
    setCreateOpen(false);
  }

  function handleSubmit(values: TaskFormInput): void {
    startTransition(async () => {
      try {
        await createTask(values);
        showSuccessToast(tManage("saved"));
        closeCreate();
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

  function openTask(documentId: string): void {
    router.push(`/tasks/${documentId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tManage("title")}</h1>
        <Button type="button" variant="outline" onClick={() => setCreateOpen(true)}>
          {tManage("newTask")}
        </Button>
      </div>

      {createOpen ? (
        <CreateTaskDialog
          steps={steps}
          isPending={isPending}
          onClose={closeCreate}
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
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.documentId}
              className={cn(
                "border-b cursor-pointer hover:bg-muted/40",
                "focus-visible:bg-muted/40 focus-visible:outline-none",
              )}
              tabIndex={0}
              role="link"
              aria-label={task.name}
              onClick={() => openTask(task.documentId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openTask(task.documentId);
                }
              }}
            >
              <td className="py-2">
                {task.name}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
