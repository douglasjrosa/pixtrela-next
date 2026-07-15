"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { SubTaskPresetForm } from "@/components/subtask-presets/subtask-preset-form";
import { Button } from "@/components/ui/button";
import type { SubTaskPresetFormInput } from "@/lib/schemas/sub-task-preset";

export interface SubTaskPresetFormModalProps {
  open: boolean;
  title: string;
  formId: string;
  defaultValues: SubTaskPresetFormInput;
  saving?: boolean;
  showDelete?: boolean;
  onClose: () => void;
  onSave: (values: SubTaskPresetFormInput) => void;
  onDelete?: () => void;
}

export function SubTaskPresetFormModal({
  open,
  title,
  formId,
  defaultValues,
  saving = false,
  showDelete = false,
  onClose,
  onSave,
  onDelete,
}: SubTaskPresetFormModalProps) {
  const tCommon = useTranslations("common");
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden " +
          "rounded-lg border bg-background shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={tCommon("close")}
            disabled={saving}
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        </div>

        <div className="overflow-y-auto p-4">
          <SubTaskPresetForm
            key={formId}
            formId={formId}
            defaultValues={defaultValues}
            disabled={saving}
            onSubmit={onSave}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
          {showDelete && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={onDelete}
            >
              {tCommon("delete")}
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form={formId} disabled={saving}>
            {tCommon("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
