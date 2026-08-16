import { TemplateListRowView } from "./template-list-row";
import type { TemplateListRow } from "./types";

export interface TemplatesListTableBodyProps {
  templates: TemplateListRow[];
}

export async function TemplatesListTableBody({
  templates,
}: TemplatesListTableBodyProps) {
  return (
    <tbody>
      {templates.map((template) => (
        <TemplateListRowView
          key={template.documentId}
          template={template}
          variant="table"
        />
      ))}
    </tbody>
  );
}
