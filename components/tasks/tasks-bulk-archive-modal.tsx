"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DeactivationReasonField } from "@/components/ui/deactivation-reason-field";
import { FORM_MODAL_DIALOG_OVERLAY_Z_CLASS } from "@/components/ui/form-modal-shell";
import { bulkTaskDeactivationSchema } from "@/lib/schemas/task";
import {
  BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY,
} from "@/lib/schemas/deactivation-reason";
import { cn } from "@/lib/utils";

export interface TasksBulkArchiveModalProps {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: (reasonForDeactivation: string) => void;
}

export function TasksBulkArchiveModal({
  open,
  disabled = false,
  onClose,
  onConfirm,
}: TasksBulkArchiveModalProps) {
  const tCommon = useTranslations("common");
  const tManage = useTranslations("tasks.manage");
  const [reasonForDeactivation, setReasonForDeactivation] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open && open !== prevOpen) {
    setPrevOpen(open);
    setReasonForDeactivation("");
    setReasonError(null);
  } else if (open !== prevOpen) {
    setPrevOpen(open);
  }

  if (!open) return null;

  function handleConfirm(): void {
    const parsed = bulkTaskDeactivationSchema.safeParse({
      reasonForDeactivation,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setReasonError(issue?.message ?? tManage("validationError"));
      return;
    }
    onConfirm(parsed.data.reasonForDeactivation.trim());
  }

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/50 p-4",
        FORM_MODAL_DIALOG_OVERLAY_Z_CLASS,
      )}
      role="presentation"
      onClick={disabled ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tasks-bulk-archive-title"
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          <h2 id="tasks-bulk-archive-title" className="text-lg font-semibold">
            {tManage("archiveTitle")}
          </h2>

          <DeactivationReasonField
            id="tasks-bulk-archive-reason"
            label={tManage("reasonForDeactivation")}
            value={reasonForDeactivation}
            errorMessage={
              reasonError === BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY
                ? tCommon(BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY)
                : reasonError
            }
            disabled={disabled}
            onChange={(value) => {
              setReasonForDeactivation(value);
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
            <Button
              type="button"
              disabled={disabled}
              onClick={handleConfirm}
            >
              {tManage("archive")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
