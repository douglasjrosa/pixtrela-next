"use client";

import { useEffect, useState } from "react";

import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DeactivationReasonField } from "@/components/ui/deactivation-reason-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizeSubTaskDependencyIds } from "@/lib/business/subtask-dependencies";
import {
  applySubTaskPreset,
  type SubTaskPreset,
} from "@/lib/business/subtask-preset";
import {
  ACTIVATION_STATUSES,
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
import { SubTaskNamePresetField } from "./subtask-name-preset-field";
import type { TeamAssignmentOption } from "./subtask-manager";

export interface SubTaskInlineFormProps {
  formKey: string;
  defaultValues: SubTaskFormInput;
  teams: TeamAssignmentOption[];
  dependencyOptions?: SubTaskDependencyOption[];
  currentDocumentId?: string;
  isCreate?: boolean;
  disabled?: boolean;
  hideHeading?: boolean;
  hideStatus?: boolean;
  hideActivationStatus?: boolean;
  hideAssignees?: boolean;
  plain?: boolean;
  onChange: (values: SubTaskFormInput) => void;
}

function parseFormValues(
  values: SubTaskFormInput,
  currentDocumentId?: string,
): SubTaskFormInput {
  return {
    ...values,
    dependencyIds: normalizeSubTaskDependencyIds(
      values.dependencyIds ?? [],
      currentDocumentId,
    ),
  };
}

export function SubTaskInlineForm({
  formKey,
  defaultValues,
  teams,
  dependencyOptions = [],
  currentDocumentId,
  isCreate = false,
  disabled = false,
  hideHeading = false,
  hideStatus = false,
  hideActivationStatus = false,
  hideAssignees = false,
  plain = false,
  onChange,
}: SubTaskInlineFormProps) {
  const [dependenciesOpen, setDependenciesOpen] = useState(false);
  const tSubtasks = useTranslations("subtasks");
  const tTasks = useTranslations("tasks");
  const tStatus = useTranslations("tasks.status");
  const tSharing = useTranslations("subtasks.sharingType");
  const tActivation = useTranslations("subtasks.activationStatus");
  const tCommon = useTranslations("common");

  const {
    register,
    reset,
    control,
    watch,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SubTaskFormInput>({
    resolver: zodResolver(subTaskFormSchema) as Resolver<SubTaskFormInput>,
    defaultValues,
  });

  function handleApplyPreset(preset: SubTaskPreset): void {
    const next = applySubTaskPreset(getValues(), preset);
    setValue("name", next.name, { shouldDirty: true, shouldValidate: true });
    setValue("sharingType", next.sharingType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("maxSameTimeWorkers", next.maxSameTimeWorkers, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("expectedTime", next.expectedTime, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  useEffect(() => {
    reset(defaultValues);
    // Reset only when switching rows, not on every parent-driven value sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, reset]);

  useEffect(() => {
    const subscription = watch((values) => {
      onChange(parseFormValues(values as SubTaskFormInput, currentDocumentId));
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange, currentDocumentId]);

  const activationStatus = watch("activationStatus");
  const dependencyIds = watch("dependencyIds") ?? [];
  const isDisabled = activationStatus === "disabled";
  const fieldId = (name: string): string => `${formKey}-${name}`;

  useEffect(() => {
    if (!isDisabled) return;
    void trigger("reasonForDisabling");
  }, [isDisabled, trigger]);

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        !plain && "rounded-lg border bg-muted p-4",
      )}
    >
      {hideHeading ? null : (
        <h3 className="sm:col-span-2 text-base font-semibold">
          {isCreate ? tSubtasks("newSubtask") : tCommon("edit")}
        </h3>
      )}

      {isCreate ? (
        <SubTaskNamePresetField
          id={fieldId("name")}
          label={tSubtasks("name")}
          value={watch("name") ?? ""}
          enabled
          disabled={disabled}
          errorMessage={errors.name?.message}
          onChange={(next) =>
            setValue("name", next, { shouldDirty: true, shouldValidate: true })
          }
          onApplyPreset={handleApplyPreset}
        />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={fieldId("name")}>{tSubtasks("name")}</Label>
          <Input
            id={fieldId("name")}
            disabled={disabled}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={fieldId("qty")}>{tSubtasks("qty")}</Label>
        <Input
          id={fieldId("qty")}
          type="number"
          min={1}
          disabled={disabled}
          {...register("qty", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("expectedTime")}>{tSubtasks("expectedTime")}</Label>
        <Input
          id={fieldId("expectedTime")}
          type="number"
          min={0}
          disabled={disabled}
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
          disabled={disabled}
          {...register("maxSameTimeWorkers", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={fieldId("sharingType")}>{tSubtasks("sharingTypeLabel")}</Label>
        <select
          id={fieldId("sharingType")}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          disabled={disabled}
          {...register("sharingType")}
        >
          {SHARING_TYPES.map((type) => (
            <option key={type} value={type}>
              {tSharing(type)}
            </option>
          ))}
        </select>
      </div>

      {hideStatus ? (
        <input type="hidden" {...register("status")} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={fieldId("status")}>{tTasks("manage.status")}</Label>
          <select
            id={fieldId("status")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            disabled={disabled}
            {...register("status")}
          >
            {SUB_TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tStatus(status)}
              </option>
            ))}
          </select>
        </div>
      )}

      {hideActivationStatus ? (
        <input type="hidden" {...register("activationStatus")} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={fieldId("activationStatus")}>
            {tSubtasks("activationStatusLabel")}
          </Label>
          <select
            id={fieldId("activationStatus")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            disabled={disabled}
            {...register("activationStatus")}
          >
            {ACTIVATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tActivation(status)}
              </option>
            ))}
          </select>
        </div>
      )}

      {!hideActivationStatus && isDisabled ? (
        <Controller
          name="reasonForDisabling"
          control={control}
          render={({ field }) => (
            <DeactivationReasonField
              id={fieldId("reasonForDisabling")}
              label={tSubtasks("reasonForDisabling")}
              value={field.value ?? ""}
              disabled={disabled}
              errorMessage={errors.reasonForDisabling?.message}
              onChange={(next) => {
                field.onChange(next);
                void trigger("reasonForDisabling");
              }}
            />
          )}
        />
      ) : null}

      {hideAssignees ? null : (
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
      )}

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
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
    </div>
  );
}
