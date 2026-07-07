"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import type { ColaboratorOption } from "@/lib/dashboard/types";

export interface ColaboratorPickerProps {
  options: ColaboratorOption[];
  selectedDocumentId: string;
}

export function ColaboratorPicker({
  options,
  selectedDocumentId,
}: ColaboratorPickerProps) {
  const t = useTranslations("dashboard");
  const router = useRouter();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;
    if (!value) return;
    router.push(`/?colaborator=${encodeURIComponent(value)}`);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="dashboard-colaborator">{t("colaborator")}</Label>
      <select
        id="dashboard-colaborator"
        className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm"
        value={selectedDocumentId}
        onChange={handleChange}
      >
        {options.map((option) => (
          <option key={option.documentId} value={option.documentId}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface ColaboratorLabelProps {
  name: string;
}

export function ColaboratorLabel({ name }: ColaboratorLabelProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{t("colaborator")}</p>
      <p className="text-lg font-medium">{name}</p>
    </div>
  );
}
