"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { listCategoryOptions } from "@/app/(app)/settings/subtasks/actions";
import { Label } from "@/components/ui/label";

export type SubTaskCategoryOption = {
  id: string;
  name: string;
};

export function SubTaskCategorySelect({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: string | null | undefined;
  disabled?: boolean;
  onChange: (next: string | null) => void;
}) {
  const t = useTranslations("settings");
  const [options, setOptions] = useState<SubTaskCategoryOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listCategoryOptions().then((next) => {
      if (!cancelled) setOptions(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("subTaskCategory")}</Label>
      <select
        id={id}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        disabled={disabled}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{t("noCategory")}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
