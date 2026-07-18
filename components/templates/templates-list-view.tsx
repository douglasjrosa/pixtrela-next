"use client";

import { useTranslations } from "next-intl";

import { TemplateListRowView } from "./template-list-row";
import type { TemplateListRow } from "./types";

export interface TemplatesListViewProps {
  templates: TemplateListRow[];
}

export function TemplatesListView({ templates }: TemplatesListViewProps) {
  const tTemplates = useTranslations("templates");

  if (templates.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-sm">{tTemplates("empty")}</p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tTemplates("name")}</th>
            <th>{tTemplates("code")}</th>
            <th>{tTemplates("subtasks")}</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <TemplateListRowView
              key={template.documentId}
              template={template}
              variant="table"
            />
          ))}
        </tbody>
      </table>

      <ul className="md:hidden">
        {templates.map((template) => (
          <TemplateListRowView
            key={template.documentId}
            template={template}
            variant="mobile"
          />
        ))}
      </ul>
    </>
  );
}
