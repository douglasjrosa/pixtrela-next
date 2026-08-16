import { TemplateListRowView } from "./template-list-row";
import type { TemplateListRow } from "./types";

export interface TemplatesListMobileListProps {
  templates: TemplateListRow[];
}

export async function TemplatesListMobileList({
  templates,
}: TemplatesListMobileListProps) {
  return (
    <ul className="md:hidden">
      {templates.map((template) => (
        <TemplateListRowView
          key={template.documentId}
          template={template}
          variant="mobile"
        />
      ))}
    </ul>
  );
}
