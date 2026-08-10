"use client";

import { useTranslations } from "next-intl";

import { ListEmptyMessage } from "@/components/ui/list-empty-message";

import { TemplateListRowView } from "./template-list-row";
import type { TemplateListRow } from "./types";

export interface TemplatesListViewProps {
  templates: TemplateListRow[];
}

export function TemplatesListView({ templates }: TemplatesListViewProps) {
  const tTemplates = useTranslations("templates");

  if (templates.length === 0) {
    return <ListEmptyMessage>{tTemplates("empty")}</ListEmptyMessage>;
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
