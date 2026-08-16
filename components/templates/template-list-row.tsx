import { getTranslations } from "next-intl/server";

import {
  TemplateListRowPresentational,
  type TemplateListRowLabels,
} from "./template-list-row-presentational";
import type { TemplateListRow } from "./types";

export interface TemplateListRowProps {
  template: TemplateListRow;
  variant: "table" | "mobile";
}

export async function TemplateListRowView({
  template,
  variant,
}: TemplateListRowProps) {
  const tTemplates = await getTranslations("templates");
  const labels: TemplateListRowLabels = {
    subTaskCountShort: tTemplates("subTaskCountShort", {
      count: template.subTaskCount,
    }),
  };

  return (
    <TemplateListRowPresentational
      template={template}
      variant={variant}
      href={`/templates/tasks/${template.documentId}`}
      labels={labels}
    />
  );
}
