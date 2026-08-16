"use client";

import { useListRowNavigateInteraction } from "@/lib/ui/list-row-interaction";
import { cn } from "@/lib/utils";

import type { TemplateListRow } from "./types";

const CENTER_CELL_CLASS = "text-center";

export type TemplateListRowLabels = {
  subTaskCountShort: string;
};

export interface TemplateListRowPresentationalProps {
  template: TemplateListRow;
  variant: "table" | "mobile";
  href: string;
  labels: TemplateListRowLabels;
}

export function TemplateListRowPresentational({
  template,
  variant,
  href,
  labels,
}: TemplateListRowPresentationalProps) {
  const { interactive, activate, ...a11yProps } = useListRowNavigateInteraction(
    href,
    template.name,
  );

  if (variant === "table") {
    return (
      <tr
        className={cn(
          "border-b",
          interactive && "cursor-pointer hover:bg-muted/40",
        )}
        onClick={activate}
        {...a11yProps}
      >
        <td className="py-2">
          <span>{template.name}</span>
        </td>
        <td className={CENTER_CELL_CLASS}>{template.code}</td>
        <td className={CENTER_CELL_CLASS}>{template.subTaskCount}</td>
      </tr>
    );
  }

  return (
    <li
      className={cn(
        "list-none border-b py-3",
        interactive && "cursor-pointer hover:bg-muted/40",
      )}
      onClick={activate}
      {...a11yProps}
    >
      <div className="text-base font-medium">{template.name}</div>
      <div className="text-muted-foreground text-sm">{template.code}</div>
      <div className="text-muted-foreground text-sm">
        {labels.subTaskCountShort}
      </div>
    </li>
  );
}
