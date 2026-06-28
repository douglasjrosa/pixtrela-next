"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Duration } from "@/components/ui/duration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import {
  taskFormSchema,
  TASK_STATUSES,
  type TaskFormInput,
} from "@/lib/schemas/task";

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
  onSubmit: (values: TaskFormInput) => void;
  onInvalid?: () => void;
  onCancel?: () => void;
}

export function TaskForm({
  mode,
  defaultValues,
  steps,
  metrics,
  isPending = false,
  onSubmit,
  onInvalid,
  onCancel,
}: TaskFormProps) {
  const tCommon = useTranslations("common");
  const tManage = useTranslations("tasks.manage");
  const tStatus = useTranslations("tasks.status");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
    >
      <h2 className="text-lg font-semibold sm:col-span-2">
        {mode === "edit" ? tManage("editTask") : tManage("newTask")}
      </h2>

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
          <option value="">{tManage("noStep")}</option>
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

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="templateTaskCode">{tManage("templateTaskCode")}</Label>
        <Input id="templateTaskCode" {...register("templateTaskCode")} />
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
    </form>
  );
}
