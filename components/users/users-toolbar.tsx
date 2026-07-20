"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";

export interface UsersToolbarProps {
  value: string;
  onChange: (value: string) => void;
}

export function UsersToolbar({ value, onChange }: UsersToolbarProps) {
  const tUsers = useTranslations("users");

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={tUsers("searchByName")}
        aria-label={tUsers("searchByName")}
        className="max-w-sm flex-1"
      />
    </div>
  );
}
