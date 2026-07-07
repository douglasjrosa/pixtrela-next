"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { lookupTemplateNameByCode } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Duration } from "@/components/ui/duration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  taskFormSchema,
  TASK_STATUSES,
  type TaskFormInput,
} from "@/lib/schemas/task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

import type { StepOption } from "./task-manager";

export interface TaskFormMetrics {
  totalExpectedTime: number;
  totalTimeSpent: number;
  startedAt?: string | null;
  endedAt?: string | null;
}

export interface TaskFormProps {
  mode: "create" | "edit";
  defaultValues: TaskFormInput;
  steps: StepOption[];
  metrics?: TaskFormMetrics;
  isPending?: boolean;
  layout?: "standalone" | "embedded";
  formTitleId?: string;
  onSubmit: (values: TaskFormInput) => void;
  onInvalid?: () => void;
  onCancel?: () => void;
  hideActions?: boolean;
  formId?: string;
}

export function TaskForm({
  mode,
  defaultValues,
  steps,
  metrics,
  isPending = false,
  layout = "standalone",
  formTitleId = "task-form-title",
  onSubmit,
  onInvalid,
  onCancel,
  hideActions = false,
  formId,
}: TaskFormProps) {
  const tCommon = useTranslations("common");
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");
  const [isLoadingTemplate, startLoadTemplate] = useTransition();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema) as Resolver<TaskFormInput>,
    defaultValues,
  });

  function handleLoadTemplate(): void {
    const code = getValues("templateTaskCode")?.trim() ?? "";
    if (!code) {
      showErrorToast(tManage("loadTemplateMissingCode"));
      return;
    }

    startLoadTemplate(async () => {
      try {
        const template = await lookupTemplateNameByCode(code);
        setValue("name", template.name, { shouldValidate: true });
        showSuccessToast(tManage("loadTemplateSuccess"));
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tManage("loadTemplateError"));
      }
    });
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        layout === "standalone" && "rounded-lg border p-4",
      )}
    >
      <h2 id={formTitleId} className="text-lg font-semibold sm:col-span-2">
        {mode === "edit" ? tManage("editTask") : tManage("newTask")}
      </h2>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="templateTaskCode">{tManage("templateTaskCode")}</Label>
        <div className="flex gap-2">
          <Input
            id="templateTaskCode"
            className="flex-1"
            {...register("templateTaskCode")}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isLoadingTemplate || isPending}
            onClick={handleLoadTemplate}
          >
            {tManage("loadTemplate")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{tManage("name")}</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="qty">{tManage("qty")}</Label>
        <Input
          id="qty"
          type="number"
          min={1}
          {...register("qty", { valueAsNumber: true })}
        />
        {errors.qty ? (
          <p className="text-sm text-destructive">{errors.qty.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryDate">{tManage("deliveryDate")}</Label>
        <Input id="deliveryDate" type="date" {...register("deliveryDate")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stepDocumentId">{tManage("step")}</Label>
        <select
          id="stepDocumentId"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          {...register("stepDocumentId")}
        >
          {steps.map((step) => (
            <option key={step.documentId} value={step.documentId}>
              {step.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">{tManage("status")}</Label>
        <select
          id="status"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          {...register("status")}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {mode === "edit" && metrics ? (
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:col-span-2 sm:grid-cols-2">
          <p className="font-medium sm:col-span-2">{tManage("metrics")}</p>
          <p>
            {tManage("totalExpectedTime")}:{" "}
            <Duration seconds={metrics.totalExpectedTime} />
          </p>
          <p>
            {tManage("totalTimeSpent")}:{" "}
            <Duration seconds={metrics.totalTimeSpent} />
          </p>
          <p>
            {tManage("startedAt")}: {formatDateTimePtBr(metrics.startedAt)}
          </p>
          <p>
            {tManage("endedAt")}: {formatDateTimePtBr(metrics.endedAt)}
          </p>
        </div>
      ) : null}

      {hideActions ? null : (
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              {tCommon("cancel")}
            </Button>
          ) : null}
        </div>
      )}
    </form>
  );
}
