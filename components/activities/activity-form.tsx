"use client";

import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { DatePtBrInput } from "@/components/ui/date-ptbr-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  formatActivitySubtaskLabel,
  formatColaboratorLabel,
  splitZonedDateTime,
} from "@/lib/business/activity-timestamp";
import type { ActivityFormOptions } from "@/lib/repos/activities";
import { ACTIVITY_ACTIONS } from "@/lib/schemas/activity";
import {
  adminActivityFormSchema,
  type AdminActivityFormInput,
} from "@/lib/schemas/admin-activity";
import { cn } from "@/lib/utils";

import type { ActivityRow } from "./types";

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-input",
  "bg-transparent px-3 text-sm text-foreground",
);

export function buildCreateActivityDefaults(
  options: ActivityFormOptions,
  now: Date = new Date(),
): AdminActivityFormInput {
  const parts = splitZonedDateTime(now);
  return {
    colaboratorId: options.colaborators[0]?.id ?? "",
    subTaskId: options.subTasks[0]?.id ?? "",
    action: "started",
    date: parts.date,
    time: parts.time,
    qty: 0,
  };
}

export function activityFormValuesFromRow(
  activity: ActivityRow,
): AdminActivityFormInput {
  const parts = splitZonedDateTime(new Date(activity.timestamp));
  return {
    colaboratorId: activity.colaboratorId,
    subTaskId: activity.subTaskId,
    action: activity.action,
    date: parts.date,
    time: parts.time,
    qty: activity.qty,
  };
}

export interface ActivityFormProps {
  options: ActivityFormOptions;
  defaultValues: AdminActivityFormInput;
  isPending?: boolean;
  formId: string;
  onSubmit: (values: AdminActivityFormInput) => void;
  onInvalid?: () => void;
}

export function ActivityForm({
  options,
  defaultValues,
  isPending = false,
  formId,
  onSubmit,
  onInvalid,
}: ActivityFormProps) {
  const t = useTranslations("activities");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminActivityFormInput>({
    resolver: zodResolver(adminActivityFormSchema) as Resolver<AdminActivityFormInput>,
    defaultValues,
  });

  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={handleSubmit(onSubmit, onInvalid)}
    >
      <div className="space-y-2">
        <Label htmlFor="activity-colaborator">{t("colaborator")}</Label>
        <select
          id="activity-colaborator"
          className={SELECT_CLASS}
          disabled={isPending}
          {...register("colaboratorId")}
        >
          {options.colaborators.map((colaborator) => (
            <option key={colaborator.id} value={colaborator.id}>
              {formatColaboratorLabel(colaborator.name, colaborator.code)}
            </option>
          ))}
        </select>
        {errors.colaboratorId ? (
          <p className="text-sm text-destructive">{t("validationError")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity-subtask">{t("subtask")}</Label>
        <select
          id="activity-subtask"
          className={SELECT_CLASS}
          disabled={isPending}
          {...register("subTaskId")}
        >
          {options.subTasks.map((subTask) => (
            <option key={subTask.id} value={subTask.id}>
              {formatActivitySubtaskLabel(subTask.name, subTask.taskName)}
            </option>
          ))}
        </select>
        {errors.subTaskId ? (
          <p className="text-sm text-destructive">{t("validationError")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity-action">{t("actionColumn")}</Label>
        <select
          id="activity-action"
          className={SELECT_CLASS}
          disabled={isPending}
          {...register("action")}
        >
          {ACTIVITY_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {t(`action.${action}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="activity-date">{t("date")}</Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePtBrInput
                id="activity-date"
                value={field.value}
                disabled={isPending}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-time">{t("time")}</Label>
          <Input
            id="activity-time"
            type="time"
            disabled={isPending}
            {...register("time")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity-qty">{t("qty")}</Label>
        <NumberInput
          id="activity-qty"
          min={0}
          disabled={isPending}
          {...register("qty", { valueAsNumber: true })}
        />
      </div>
    </form>
  );
}
