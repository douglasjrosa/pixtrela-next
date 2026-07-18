"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import {
  defaultTemplateListFilters,
  serializeTemplateListSearchParams,
} from "@/lib/templates/template-list-params";
import { TEMPLATES_TASKS_LIST_PATH } from "./templates-page-layout";

export interface TemplatesFilterModalProps {
  open: boolean;
  initialFilters: TemplateListFilters;
  onClose: () => void;
}

export function TemplatesFilterModal({
  open,
  initialFilters,
  onClose,
}: TemplatesFilterModalProps) {
  const tTemplates = useTranslations("templates");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<TemplateListFilters>(initialFilters);

  useEffect(() => {
    if (open) {
      setDraft(initialFilters);
    }
  }, [open, initialFilters]);

  if (!open) return null;

  const titleId = "templates-filter-modal-title";

  function applyFilters(next: TemplateListFilters): void {
    const params = serializeTemplateListSearchParams(next);
    const query = params.toString();
    startTransition(() => {
      router.replace(
        query
          ? `${TEMPLATES_TASKS_LIST_PATH}?${query}`
          : TEMPLATES_TASKS_LIST_PATH,
      );
      onClose();
    });
  }

  function handleApply(): void {
    applyFilters(draft);
  }

  function handleClear(): void {
    const cleared = defaultTemplateListFilters();
    setDraft(cleared);
    applyFilters(cleared);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "relative w-full max-w-md rounded-lg border bg-background p-4 " +
          "shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          disabled={isPending}
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>

        <h2 id={titleId} className="mb-4 pr-10 text-lg font-semibold">
          {tTemplates("filters")}
        </h2>

        <div className="mb-4 space-y-1">
          <Label htmlFor="template-filter-code">{tTemplates("codeFilter")}</Label>
          <Input
            id="template-filter-code"
            value={draft.code ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                code: event.target.value || undefined,
              }))
            }
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleClear}
          >
            {tTemplates("clearFilters")}
          </Button>
          <Button type="button" disabled={isPending} onClick={handleApply}>
            {tTemplates("applyFilters")}
          </Button>
        </div>
      </div>
    </div>
  );
}
