"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ListFilterModalShell } from "@/components/ui/list-filter-modal-shell";
import { MEDIA_LIBRARY_CATEGORY_OPTIONS } from "@/components/settings/media-library-category-options";
import type { MediaCategory, MediaMimeFilter } from "@/lib/repos/media";

const TITLE_ID = "media-files-filter-modal-title";

export type MediaFilesFilterValues = {
  mimeFilter: MediaMimeFilter;
  categoryFilter: MediaCategory | "all";
};

const MIME_OPTIONS: { value: MediaMimeFilter; labelKey: string }[] = [
  { value: "all", labelKey: "mediaFilterAll" },
  { value: "image", labelKey: "mediaFilterImages" },
  { value: "pdf", labelKey: "mediaFilterPdf" },
];

export function MediaFilesFilterModal({
  initialValues,
  disabled = false,
  onClose,
  onApply,
}: {
  initialValues: MediaFilesFilterValues;
  disabled?: boolean;
  onClose: () => void;
  onApply: (values: MediaFilesFilterValues) => void;
}) {
  const t = useTranslations("settings");
  const [draft, setDraft] = useState(initialValues);

  function handleClear(): void {
    const cleared: MediaFilesFilterValues = {
      mimeFilter: "all",
      categoryFilter: "all",
    };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  }

  function handleApply(): void {
    onApply(draft);
    onClose();
  }

  return (
    <ListFilterModalShell
      titleId={TITLE_ID}
      title={t("mediaFilters")}
      disabled={disabled}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={handleClear}
          >
            {t("mediaClearFilters")}
          </Button>
          <Button type="button" disabled={disabled} onClick={handleApply}>
            {t("mediaApplyFilters")}
          </Button>
        </>
      }
    >
      <fieldset className="mb-4 space-y-2">
        <legend className="mb-2 text-sm font-medium">
          {t("mediaFilterTypeLegend")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {MIME_OPTIONS.map(({ value, labelKey }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={draft.mimeFilter === value ? "default" : "outline"}
              disabled={disabled}
              onClick={() =>
                setDraft((current) => ({ ...current, mimeFilter: value }))
              }
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">
          {t("mediaCategory")}
        </legend>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={draft.categoryFilter === "all" ? "default" : "outline"}
            disabled={disabled}
            onClick={() =>
              setDraft((current) => ({ ...current, categoryFilter: "all" }))
            }
          >
            {t("mediaCategories.all")}
          </Button>
          {MEDIA_LIBRARY_CATEGORY_OPTIONS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={draft.categoryFilter === value ? "default" : "outline"}
              disabled={disabled}
              onClick={() =>
                setDraft((current) => ({ ...current, categoryFilter: value }))
              }
            >
              {t(`mediaCategories.${value}`)}
            </Button>
          ))}
        </div>
      </fieldset>
    </ListFilterModalShell>
  );
}
