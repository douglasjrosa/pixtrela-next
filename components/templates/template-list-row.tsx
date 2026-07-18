import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { TemplateListRow } from "./types";

export interface TemplateListRowProps {
  template: TemplateListRow;
  variant: "table" | "mobile";
}

export function TemplateListRowView({
  template,
  variant,
}: TemplateListRowProps) {
  const tTemplates = useTranslations("templates");
  const router = useRouter();

  function openTemplate(): void {
    router.push(`/templates/tasks/${template.documentId}`);
  }

  const interaction = {
    tabIndex: 0 as const,
    role: "link" as const,
    "aria-label": template.name,
    onClick: openTemplate,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTemplate();
      }
    },
  };

  if (variant === "table") {
    return (
      <tr
        {...interaction}
        className={cn(
          "border-b cursor-pointer hover:bg-muted/40",
          "focus-visible:bg-muted/40 focus-visible:outline-none",
        )}
      >
        <td className="py-2">{template.name}</td>
        <td>{template.code}</td>
        <td>{template.subTaskCount}</td>
      </tr>
    );
  }

  return (
    <li
      {...interaction}
      className={cn(
        "list-none border-b py-3 cursor-pointer hover:bg-muted/40",
        "focus-visible:bg-muted/40 focus-visible:outline-none",
      )}
    >
      <div className="text-base font-medium">{template.name}</div>
      <div className="text-muted-foreground text-sm">{template.code}</div>
      <div className="text-muted-foreground text-sm">
        {tTemplates("subTaskCountShort", { count: template.subTaskCount })}
      </div>
    </li>
  );
}
