"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { parseTemplateListSearchParams } from "@/lib/templates/template-list-params";

import { TemplatesFilterModal } from "./templates-filter-modal";
import { TemplatesNameSearch } from "./templates-name-search";

export function TemplatesToolbar() {
  const tTemplates = useTranslations("templates");
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = parseTemplateListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFiltersOpen(true)}
        >
          {tTemplates("filters")}
        </Button>
        <TemplatesNameSearch />
      </div>
      <TemplatesFilterModal
        open={filtersOpen}
        initialFilters={filters}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
