"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { createTask } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { buildCreateTaskFormDefaults } from "@/lib/business/default-task-step";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { TaskFormInput } from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TaskForm } from "./task-form";
import type { StepOption } from "./types";

const CREATE_TASK_FORM_ID = "create-task-form";
const CREATE_TASK_TITLE_ID = "task-form-title";

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
  const tManage = useTranslations("tasks.manage");

  return (
    <FormModalShell
      open
      title={tManage("newTask")}
      titleId={CREATE_TASK_TITLE_ID}
      onClose={onClose}
      disabled={isPending}
      footerEnd={
        <Button type="submit" form={CREATE_TASK_FORM_ID} disabled={isPending}>
          {tCommon("save")}
        </Button>
      }
    >
      <TaskForm
        mode="create"
        defaultValues={buildCreateTaskFormDefaults(steps)}
        layout="embedded"
        formId={CREATE_TASK_FORM_ID}
        formTitleId={CREATE_TASK_TITLE_ID}
        hideTitle
        hideActions
        isPending={isPending}
        onSubmit={onSubmit}
        onInvalid={onInvalid}
      />
    </FormModalShell>
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
      <h1 className="text-2xl font-bold max-[500px]:text-lg">{tManage("title")}</h1>
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
