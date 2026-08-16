import { getTranslations } from "next-intl/server";

import {
  TemplateListRowPresentational,
  type TemplateListRowLabels,
} from "./template-list-row-presentational";
import type { TemplateListRow } from "./types";

export interface TemplateListRowProps {
  template: TemplateListRow;
  variant: "table" | "mobile";
  showCheckboxColumn?: boolean;
}

export async function TemplateListRowView({
  template,
  variant,
  showCheckboxColumn = false,
}: TemplateListRowProps) {
  const tTemplates = await getTranslations("templates");
  const tCommon = await getTranslations("common");
  const labels: TemplateListRowLabels = {
    subTaskCountShort: tTemplates("subTaskCountShort", {
      count: template.subTaskCount,
    }),
    inactive: tTemplates("inactive"),
    selectRow: tCommon("selectRow", { name: template.name }),
  };

  return (
    <TemplateListRowPresentational
      template={template}
      variant={variant}
      href={`/templates/tasks/${template.documentId}`}
      labels={labels}
      showCheckboxColumn={showCheckboxColumn}
    />
  );
}
