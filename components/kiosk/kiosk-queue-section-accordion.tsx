"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function KioskQueueSectionAccordion({
  id,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = `${id}-panel`;
  return (
    <section aria-labelledby={id}>
      <button
        type="button"
        id={id}
        className="mb-3 flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div id={panelId} role="region" aria-labelledby={id}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
