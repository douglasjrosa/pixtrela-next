"use client";

import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { FactoryActionSearchField } from "@/components/factory-actions/factory-action-search-field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { SubTaskCategorySelect } from "@/components/subtasks/subtask-category-select";
import { SHARING_TYPES } from "@/lib/schemas/sub-task";
import {
  subTaskPresetFormSchema,
  type SubTaskPresetFormInput,
} from "@/lib/schemas/sub-task-preset";

export interface SubTaskPresetFormProps {
  formId: string;
  defaultValues: SubTaskPresetFormInput;
  actionName?: string;
  disabled?: boolean;
  onSubmit: (values: SubTaskPresetFormInput) => void;
}

export function SubTaskPresetForm({
  formId,
  defaultValues,
  actionName = "",
  disabled = false,
  onSubmit,
}: SubTaskPresetFormProps) {
  const tSubtasks = useTranslations("subtasks");
  const tSharing = useTranslations("subtasks.sharingType");
  const [selectedActionName, setSelectedActionName] = useState(actionName);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, submitCount },
  } = useForm<SubTaskPresetFormInput>({
    resolver: zodResolver(
      subTaskPresetFormSchema,
    ) as Resolver<SubTaskPresetFormInput>,
    defaultValues,
  });

  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`}>{tSubtasks("name")}</Label>
        <Input
          id={`${formId}-name`}
          disabled={disabled}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Controller
          name="actionId"
          control={control}
          render={({ field }) => (
            <FactoryActionSearchField
              id={`${formId}-action`}
              value={field.value}
              selectedName={selectedActionName}
              disabled={disabled}
              errorMessage={
                submitCount > 0 ? (errors.actionId?.message ?? null) : null
              }
              onChange={(actionId, action) => {
                field.onChange(actionId);
                if (action) {
                  setSelectedActionName(action.name);
                  setValue("actionId", actionId, { shouldValidate: true });
                  return;
                }
                clearErrors("actionId");
              }}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-maxSameTimeWorkers`}>
          {tSubtasks("maxSameTimeWorkers")}
        </Label>
        <NumberInput
          id={`${formId}-maxSameTimeWorkers`}
          min={1}
          disabled={disabled}
          {...register("maxSameTimeWorkers", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-sharingType`}>
          {tSubtasks("sharingTypeLabel")}
        </Label>
        <Controller
          name="sharingType"
          control={control}
          render={({ field }) => (
            <select
              id={`${formId}-sharingType`}
              className={
                "flex h-9 w-full rounded-md border border-input " +
                "bg-transparent px-3 text-sm text-foreground"
              }
              disabled={disabled}
              value={field.value}
              onChange={field.onChange}
            >
              {SHARING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tSharing(type)}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Controller
          name="subTaskCategoryId"
          control={control}
          render={({ field }) => (
            <SubTaskCategorySelect
              id={`${formId}-category`}
              value={field.value}
              disabled={disabled}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </form>
  );
}
