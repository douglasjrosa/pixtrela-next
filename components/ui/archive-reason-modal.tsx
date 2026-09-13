"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DeactivationReasonField } from "@/components/ui/deactivation-reason-field";
import { FORM_MODAL_DIALOG_OVERLAY_Z_CLASS } from "@/components/ui/form-modal-shell";
import { archiveWithReasonSchema } from "@/lib/schemas/archive-with-reason";
import { cn } from "@/lib/utils";

export interface ArchiveReasonModalProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Number of records being archived; drives min length (1 → 100, 2+ → 50). */
  count: number;
  disabled?: boolean;
  confirmLabel?: string;
  titleId?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function ArchiveReasonModal({
  open,
  title,
  description,
  count,
  disabled = false,
  confirmLabel,
  titleId = "archive-reason-modal-title",
  onClose,
  onConfirm,
}: ArchiveReasonModalProps) {
  const tCommon = useTranslations("common");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  const recordCount = Math.max(1, count);

  if (open && open !== prevOpen) {
    setPrevOpen(open);
    setReason("");
    setReasonError(null);
  } else if (open !== prevOpen) {
    setPrevOpen(open);
  }

  if (!open) return null;

  function handleConfirm(): void {
    const parsed = archiveWithReasonSchema(recordCount).safeParse({
      reasonForDeactivation: reason,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setReasonError(
        issue?.message ?? tCommon("archiveReason.validationError"),
      );
      return;
    }
    onConfirm(parsed.data.reasonForDeactivation.trim());
  }

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
            {description ? (
              <div className="text-sm text-muted-foreground">{description}</div>
            ) : null}
          </div>

          <DeactivationReasonField
            id={`${titleId}-reason`}
            label={tCommon("archiveReason.label")}
            value={reason}
            errorMessage={reasonError}
            disabled={disabled}
            onChange={(value) => {
              setReason(value);
              setReasonError(null);
            }}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={onClose}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="button" disabled={disabled} onClick={handleConfirm}>
              {confirmLabel ?? tCommon("archiveReason.confirm")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
