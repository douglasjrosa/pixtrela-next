"use client";

import { useEffect, useState } from "react";

import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizeSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import {
  ACTIVATION_STATUSES,
  REASON_FOR_DISABLING_MIN_LENGTH_KEY,
  SHARING_TYPES,
  SUB_TASK_STATUSES,
  subTaskFormSchema,
  type SubTaskFormInput,
} from "@/lib/schemas/sub-task";

import { SubTaskAssigneePicker } from "./subtask-assignee-picker";
import {
  SubTaskDependenciesModal,
  type SubTaskDependencyOption,
} from "./subtask-dependencies-modal";
import type { TeamAssignmentOption } from "./subtask-manager";

export interface SubTaskInlineFormProps {
  formKey: string;
  defaultValues: SubTaskFormInput;
  teams: TeamAssignmentOption[];
  dependencyOptions?: SubTaskDependencyOption[];
  currentDocumentId?: string;
  isCreate?: boolean;
  isPending?: boolean;
  onSubmit: (values: SubTaskFormInput) => void | Promise<void>;
  onCancel?: () => void;
}
export function SubTaskInlineForm({
  formKey,
  defaultValues,
  teams,
  dependencyOptions = [],
  currentDocumentId,
  isCreate = false,
  isPending = false,
  onSubmit,
  onCancel,
}: SubTaskInlineFormProps) {
  const [dependenciesOpen, setDependenciesOpen] = useState(false);  const tCommon = useTranslations("common");
  const tSubtasks = useTranslations("subtasks");
  const tTasks = useTranslations("tasks");
  const tStatus = useTranslations("tasks.status");
  const tSharing = useTranslations("subtasks.sharingType");
  const tActivation = useTranslations("subtasks.activationStatus");

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubTaskFormInput>({
    resolver: zodResolver(subTaskFormSchema) as Resolver<SubTaskFormInput>,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, formKey, reset]);

  const activationStatus = watch("activationStatus");
  const dependencyIds = watch("dependencyIds") ?? [];
  const isDisabled = activationStatus === "disabled";
  const fieldId = (name: string): string => `${formKey}-${name}`;

  const textareaClass = cn(
    "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2",
    "text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
    "disabled:opacity-50",
  );

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          dependencyIds: normalizeSubTaskDependencyIds(
            values.dependencyIds ?? [],
            currentDocumentId,
          ),
        }),
      )}
      className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2"
    >
      <h3 className="sm:col-span-2 text-base font-semibold">
        {isCreate ? tSubtasks("newSubtask") : tCommon("edit")}
      </h3>

      <div className="space-y-2">
        <Label htmlFor={fieldId("name")}>{tSubtasks("name")}</Label>
        <Input id={fieldId("name")} {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("qty")}>{tSubtasks("qty")}</Label>
        <Input
          id={fieldId("qty")}
          type="number"
          min={1}
          {...register("qty", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("expectedTime")}>{tSubtasks("expectedTime")}</Label>
        <Input
          id={fieldId("expectedTime")}
          type="number"
          min={0}
          {...register("expectedTime", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("maxSameTimeWorkers")}>
          {tSubtasks("maxSameTimeWorkers")}
        </Label>
        <Input
          id={fieldId("maxSameTimeWorkers")}
          type="number"
          min={1}
          {...register("maxSameTimeWorkers", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("sharingType")}>{tSubtasks("sharingTypeLabel")}</Label>
        <select
          id={fieldId("sharingType")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          {...register("sharingType")}
        >
          {SHARING_TYPES.map((type) => (
            <option key={type} value={type}>
              {tSharing(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("status")}>{tTasks("manage.status")}</Label>
        <select
          id={fieldId("status")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          {...register("status")}
        >
          {SUB_TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tStatus(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("activationStatus")}>
          {tSubtasks("activationStatusLabel")}
        </Label>
        <select
          id={fieldId("activationStatus")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          {...register("activationStatus")}
        >
          {ACTIVATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {tActivation(status)}
            </option>
          ))}
        </select>
      </div>

      {isDisabled ? (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={fieldId("reasonForDisabling")}>
            {tSubtasks("reasonForDisabling")}
          </Label>
          <textarea
            id={fieldId("reasonForDisabling")}
            className={textareaClass}
            {...register("reasonForDisabling")}
          />
          {errors.reasonForDisabling ? (
            <p className="text-sm text-destructive">
              {errors.reasonForDisabling.message ===
              REASON_FOR_DISABLING_MIN_LENGTH_KEY
                ? tSubtasks(REASON_FOR_DISABLING_MIN_LENGTH_KEY)
                : errors.reasonForDisabling.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Controller
          name="assignedToIds"
          control={control}
          render={({ field }) => (
            <SubTaskAssigneePicker
              id={fieldId("assignedToIds")}
              label={tSubtasks("assignedTo")}
              teams={teams}
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {tCommon("cancel")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setDependenciesOpen(true)}
        >
          {tSubtasks("dependencies")}
        </Button>
        <span className="text-sm text-muted-foreground">
          {tSubtasks("dependenciesCount", { count: dependencyIds.length })}
        </span>
      </div>

      <SubTaskDependenciesModal
        open={dependenciesOpen}
        options={dependencyOptions}
        selectedIds={dependencyIds}
        onClose={() => setDependenciesOpen(false)}
        onConfirm={(ids) => setValue("dependencyIds", ids, { shouldDirty: true })}
      />
    </form>
  );
}