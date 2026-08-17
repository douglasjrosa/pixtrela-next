import Link from "next/link";

import { CardBadge } from "@/components/ui/card";

import { TemplateListRowCheckbox } from "./template-list-row-checkbox";
import type { TemplateListRow } from "./types";

const CENTER_CELL_CLASS = "text-center";
const ROW_LINK_CLASS =
  "text-inherit after:absolute after:inset-0 after:content-['']";

export type TemplateListRowLabels = {
  subTaskCountShort: string;
  inactive: string;
  selectRow: string;
};

export interface TemplateListRowPresentationalProps {
  template: TemplateListRow;
  variant: "table" | "mobile";
  href: string;
  labels: TemplateListRowLabels;
  showCheckboxColumn?: boolean;
}

export function TemplateListRowPresentational({
  template,
  variant,
  href,
  labels,
  showCheckboxColumn = false,
}: TemplateListRowPresentationalProps) {
  const nameCell = (
    <>
      {template.name}
      {!template.active ? (
        <CardBadge className="ml-2">{labels.inactive}</CardBadge>
      ) : null}
    </>
  );

  if (variant === "table") {
    return (
      <tr className="relative cursor-pointer border-b hover:bg-muted/40">
        {showCheckboxColumn ? (
          <TemplateListRowCheckbox
            documentId={template.documentId}
            variant="table"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <td className="py-2">
          <Link
            href={href}
            className={ROW_LINK_CLASS}
            aria-label={template.name}
          >
            {nameCell}
          </Link>
        </td>
        <td className={CENTER_CELL_CLASS}>{template.code}</td>
        <td className={CENTER_CELL_CLASS}>{template.subTaskCount}</td>
      </tr>
    );
  }

  return (
    <li className="list-none border-b hover:bg-muted/40">
      <div className="flex items-start gap-3">
        {showCheckboxColumn ? (
          <TemplateListRowCheckbox
            documentId={template.documentId}
            variant="mobile"
            ariaLabel={labels.selectRow}
          />
        ) : null}
        <Link
          href={href}
          className="min-w-0 flex-1 cursor-pointer py-3"
          aria-label={template.name}
        >
          <div className="text-base font-medium">{nameCell}</div>
          <div className="text-muted-foreground text-sm">{template.code}</div>
          <div className="text-muted-foreground text-sm">
            {labels.subTaskCountShort}
          </div>
        </Link>
      </div>
    </li>
  );
}
