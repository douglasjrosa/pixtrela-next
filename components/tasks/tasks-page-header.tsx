"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createTask } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { buildCreateTaskFormDefaults } from "@/lib/business/default-task-step";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskFormInput } from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TaskForm } from "./task-form";
import type { StepOption } from "./types";

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

export interface TasksPageHeaderProps {
  steps: StepOption[];
}

export function TasksPageHeader({ steps }: TasksPageHeaderProps) {
  const tManage = useTranslations("tasks.manage");
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

  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{tManage("title")}</h1>
      <Button type="button" variant="outline" onClick={() => setCreateOpen(true)}>
        {tManage("newTask")}
      </Button>

      {createOpen ? (
        <CreateTaskDialog
          steps={steps}
          isPending={isPending}
          onClose={closeCreate}
          onSubmit={handleSubmit}
          onInvalid={handleInvalid}
        />
      ) : null}
    </div>
  );
}
