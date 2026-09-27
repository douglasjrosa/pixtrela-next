"use client";

import { useTranslations } from "next-intl";

import { ListShowArchivedFilterModal } from "@/components/ui/list-show-archived-filter-modal";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import { serializeTemplateListSearchParams } from "@/lib/templates/template-list-params";

import { TEMPLATES_TASKS_LIST_PATH } from "./templates-page-layout";

export function TemplatesFilterModal({
  initialFilters,
  onClose,
}: {
  initialFilters: TemplateListFilters;
  onClose: () => void;
}) {
  const tTemplates = useTranslations("templates");

  return (
    <ListShowArchivedFilterModal
      titleId="templates-filter-modal-title"
      title={tTemplates("filters")}
      showArchivedLabel={tTemplates("showArchived")}
      clearLabel={tTemplates("clearFilters")}
      applyLabel={tTemplates("applyFilters")}
      pathname={TEMPLATES_TASKS_LIST_PATH}
      initialFilters={initialFilters}
      onClose={onClose}
      serializeFilters={serializeTemplateListSearchParams}
    />
  );
}
