"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function LeaderRoleBadge({ className }: { className?: string }) {
  const t = useTranslations("users.roles");
  return (
    <span
      className={cn(
        "rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold",
        "uppercase tracking-wide text-secondary-foreground",
        className,
      )}
    >
      {t("leader")}
    </span>
  );
}
