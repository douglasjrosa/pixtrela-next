"use client";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseTemplateDependencyUiIds } from "@/lib/business/template-subtask-dependency-refs";
import { SHARING_TYPES } from "@/lib/schemas/sub-task";
import {
  templateSubTaskFormSchema,
  type TemplateSubTaskFormInput,
} from "@/lib/schemas/template-sub-task";

import {
  SubTaskDependenciesModal,
  type SubTaskDependencyOption,
} from "../subtasks/subtask-dependencies-modal";

export interface TemplateSubTaskInlineFormProps {
  formKey: string;
  defaultValues: TemplateSubTaskFormInput;
  dependencyOptions?: SubTaskDependencyOption[];
  currentRowKey?: string;
  isCreate?: boolean;
  disabled?: boolean;
  onChange: (values: TemplateSubTaskFormInput) => void;
  onCancel?: () => void;
}

function parseFormValues(
  values: TemplateSubTaskFormInput,
  currentRowKey?: string,
): TemplateSubTaskFormInput {
  return {
    ...values,
    dependencyIds: parseTemplateDependencyUiIds(values.dependencyIds ?? [])
      .filter((index) => String(index) !== currentRowKey)
      .map(String),
  };
}

export function TemplateSubTaskInlineForm({
  formKey,
  defaultValues,
  dependencyOptions = [],
  currentRowKey,
  isCreate = false,
  disabled = false,
  onChange,
  onCancel,
}: TemplateSubTaskInlineFormProps) {
  const [dependenciesOpen, setDependenciesOpen] = useState(false);
  const tCommon = useTranslations("common");
  const tSubtasks = useTranslations("subtasks");
  const tSharing = useTranslations("subtasks.sharingType");

  const {
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateSubTaskFormInput>({
    resolver: zodResolver(templateSubTaskFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
    // Reset only when switching rows, not on every parent-driven value sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, reset]);

  useEffect(() => {
    const subscription = watch((values) => {
      onChange(parseFormValues(values as TemplateSubTaskFormInput, currentRowKey));
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange, currentRowKey]);

  const dependencyIds = watch("dependencyIds") ?? [];
  const fieldId = (name: string): string => `${formKey}-${name}`;

  return (
    <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
      <h3 className="sm:col-span-2 text-base font-semibold">
        {isCreate ? tSubtasks("newSubtask") : tCommon("edit")}
      </h3>

      <div className="space-y-2">
        <Label htmlFor={fieldId("name")}>{tSubtasks("name")}</Label>
        <Input id={fieldId("name")} disabled={disabled} {...register("name")} />
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

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
          >
            {tCommon("cancel")}
          </Button>
        ) : null}
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
