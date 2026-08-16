import { TemplateListRowView } from "./template-list-row";
import type { TemplateListRow } from "./types";

export interface TemplatesListTableBodyProps {
  templates: TemplateListRow[];
  showCheckboxColumn?: boolean;
}

export async function TemplatesListTableBody({
  templates,
  showCheckboxColumn = false,
}: TemplatesListTableBodyProps) {
  return (
    <tbody>
      {templates.map((template) => (
        <TemplateListRowView
          key={template.documentId}
          template={template}
          variant="table"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </tbody>
  );
}
