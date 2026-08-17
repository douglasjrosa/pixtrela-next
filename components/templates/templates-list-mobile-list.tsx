import { TemplateListRowView } from "./template-list-row";
import type { TemplateListRow } from "./types";

export interface TemplatesListMobileListProps {
  templates: TemplateListRow[];
  showCheckboxColumn?: boolean;
}

export async function TemplatesListMobileList({
  templates,
  showCheckboxColumn = false,
}: TemplatesListMobileListProps) {
  return (
    <ul className="md:hidden">
      {templates.map((template) => (
        <TemplateListRowView
          key={template.documentId}
          template={template}
          variant="mobile"
          showCheckboxColumn={showCheckboxColumn}
        />
      ))}
    </ul>
  );
}
