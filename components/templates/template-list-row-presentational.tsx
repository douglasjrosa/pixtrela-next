import Link from "next/link";

import type { TemplateListRow } from "./types";

const CENTER_CELL_CLASS = "text-center";
const ROW_LINK_CLASS =
  "text-inherit after:absolute after:inset-0 after:content-['']";

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
  if (variant === "table") {
    return (
      <tr className="relative cursor-pointer border-b hover:bg-muted/40">
        <td className="py-2">
          <Link
            href={href}
            className={ROW_LINK_CLASS}
            aria-label={template.name}
          >
            {template.name}
          </Link>
        </td>
        <td className={CENTER_CELL_CLASS}>{template.code}</td>
        <td className={CENTER_CELL_CLASS}>{template.subTaskCount}</td>
      </tr>
    );
  }

  return (
    <li className="list-none border-b hover:bg-muted/40">
      <Link
        href={href}
        className="block cursor-pointer py-3"
        aria-label={template.name}
      >
        <div className="text-base font-medium">{template.name}</div>
        <div className="text-muted-foreground text-sm">{template.code}</div>
        <div className="text-muted-foreground text-sm">
          {labels.subTaskCountShort}
        </div>
      </Link>
    </li>
  );
}
