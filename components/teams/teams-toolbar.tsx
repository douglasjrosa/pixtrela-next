"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

export interface TeamsToolbarProps {
  value: string;
  onChange: (value: string) => void;
}

export function TeamsToolbar({ value, onChange }: TeamsToolbarProps) {
  const tTeams = useTranslations("teams");

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={tTeams("searchByName")}
        aria-label={tTeams("searchByName")}
        className="max-w-sm flex-1"
      />
    </div>
  );
}
