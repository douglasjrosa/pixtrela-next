"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import type { SubTaskCategoryOption } from "@/lib/subtasks/category-options";
import { NATIVE_SELECT_CLASS_NAME } from "@/lib/ui/native-select";

import { useSubTaskCategoryOptions } from "./subtask-category-options-context";

export type { SubTaskCategoryOption };

export function SubTaskCategorySelect({
  id,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  value: string | null | undefined;
  /** When omitted, uses options from SubTaskCategoryOptionsProvider. */
  options?: SubTaskCategoryOption[];
  disabled?: boolean;
  onChange: (next: string | null) => void;
}) {
  const t = useTranslations("settings");
  const contextOptions = useSubTaskCategoryOptions();
  const resolvedOptions = options ?? contextOptions;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("subTaskCategory")}</Label>
      <select
        id={id}
        className={NATIVE_SELECT_CLASS_NAME}
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{t("noCategory")}</option>
        {resolvedOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
