"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  TASK_AUTOMATION_STATUS_FIELDS,
  taskAutomationFormSchema,
  type TaskAutomationFormInput,
} from "@/lib/schemas/task-automation";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

const SELECT_CLASS_NAME =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

export interface StepOption {
  documentId: string;
  name: string;
}

export interface TaskAutomationFormProps {
  steps: StepOption[];
  defaultValues: TaskAutomationFormInput;
  onSave: (values: TaskAutomationFormInput) => void | Promise<void>;
}

export function TaskAutomationForm({
  steps,
  defaultValues,
  onSave,
}: TaskAutomationFormProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const tStatus = useTranslations("tasks.status");
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit } = useForm<TaskAutomationFormInput>({
    resolver: zodResolver(taskAutomationFormSchema) as Resolver<TaskAutomationFormInput>,
    defaultValues,
  });

  function onSubmit(values: TaskAutomationFormInput): void {
    startTransition(async () => {
      try {
        await onSave(values);
        showSuccessToast(tSettings("saved"));
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tSettings("error"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{tSettings("automationsHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {tSettings("automationsDescription")}
        </p>
      </div>

      {TASK_AUTOMATION_STATUS_FIELDS.map(({ status, field }) => (
        <div className="flex items-center gap-3" key={status}>
          <Label htmlFor={`automation-${status}`} className="shrink-0">
            {tSettings.rich("statusGoesTo", {
              status: tStatus(status),
              bold: (chunks) => <b>{chunks}</b>,
            })}
          </Label>
          <select
            id={`automation-${status}`}
            className={`${SELECT_CLASS_NAME} flex-1`}
            {...register(field)}
          >
            <option value="">{tSettings("automationNoStep")}</option>
            {steps.map((step) => (
              <option key={step.documentId} value={step.documentId}>
                {step.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      <Button type="submit" disabled={isPending || steps.length === 0}>
        {tCommon("save")}
      </Button>
    </form>
  );
}
