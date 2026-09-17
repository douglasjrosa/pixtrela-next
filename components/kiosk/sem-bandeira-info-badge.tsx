"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function SemBandeiraInfoBadge({ className }: { className?: string }) {
  const t = useTranslations("kiosk");
  const [open, setOpen] = useState(false);
  const message = t("semBandeiraMissingCategoryInfo");

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="rounded-full border bg-muted px-2 py-0.5 text-xs">
        {t("semBandeira")}
      </span>
      <span className="group relative inline-flex">
        <button
          type="button"
          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={message}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          onBlur={() => setOpen(false)}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-56",
            "-translate-x-1/2 rounded-md border bg-popover px-2 py-1.5",
            "text-xs text-popover-foreground shadow-md",
            open ? "block" : "hidden group-hover:block group-focus-within:block",
          )}
        >
          {message}
        </span>
      </span>
    </span>
  );
}
