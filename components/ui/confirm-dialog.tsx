"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FORM_MODAL_DIALOG_OVERLAY_Z_CLASS } from "@/components/ui/form-modal-shell";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  titleId?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  titleId = "confirm-dialog-title",
  confirmLabel,
  cancelLabel,
  confirmVariant = "destructive",
  disabled = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const tCommon = useTranslations("common");

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-overlay/50 p-4",
        FORM_MODAL_DIALOG_OVERLAY_Z_CLASS,
      )}
      role="presentation"
      onClick={disabled ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={onClose}
            >
              {cancelLabel ?? tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              disabled={disabled}
              onClick={onConfirm}
            >
              {confirmLabel ?? tCommon("confirm")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
