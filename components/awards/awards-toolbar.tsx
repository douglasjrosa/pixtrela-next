"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

export interface AwardsToolbarProps {
  value: string;
  onChange: (value: string) => void;
}

export function AwardsToolbar({ value, onChange }: AwardsToolbarProps) {
  const tAwards = useTranslations("awards");

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={tAwards("searchByName")}
        aria-label={tAwards("searchByName")}
        className="max-w-sm flex-1"
      />
    </div>
  );
}
