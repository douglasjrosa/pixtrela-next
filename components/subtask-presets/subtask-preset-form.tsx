"use client";

import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHARING_TYPES } from "@/lib/schemas/sub-task";
import {
  subTaskPresetFormSchema,
  type SubTaskPresetFormInput,
} from "@/lib/schemas/sub-task-preset";

export interface SubTaskPresetFormProps {
  formId: string;
  defaultValues: SubTaskPresetFormInput;
  disabled?: boolean;
  onSubmit: (values: SubTaskPresetFormInput) => void;
}

export function SubTaskPresetForm({
  formId,
  defaultValues,
  disabled = false,
  onSubmit,
}: SubTaskPresetFormProps) {
  const tSubtasks = useTranslations("subtasks");
  const tSharing = useTranslations("subtasks.sharingType");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SubTaskPresetFormInput>({
    resolver: zodResolver(subTaskPresetFormSchema) as Resolver<SubTaskPresetFormInput>,
    defaultValues,
  });

  return (
    <form
      id={formId}
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2 sm:col-span-2">
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
        <Label htmlFor={`${formId}-expectedTime`}>
          {tSubtasks("expectedTime")}
        </Label>
        <Input
          id={`${formId}-expectedTime`}
          type="number"
          min={0}
          disabled={disabled}
          {...register("expectedTime", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-maxSameTimeWorkers`}>
          {tSubtasks("maxSameTimeWorkers")}
        </Label>
        <Input
          id={`${formId}-maxSameTimeWorkers`}
          type="number"
          min={1}
          disabled={disabled}
          {...register("maxSameTimeWorkers", { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
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
                "bg-transparent px-3 text-sm"
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
    </form>
  );
}
