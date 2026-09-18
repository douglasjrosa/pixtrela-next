"use client";

import type { MaterialFlagOption } from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

import { KioskExitModalShell } from "./kiosk-exit-modal-shell";
import { KioskExitSubtaskForm } from "./kiosk-exit-subtask-form";

export interface KioskExitSubtaskModalProps {
  open: boolean;
  title: string;
  sharingType: SubTaskFormInput["sharingType"];
  maxQty?: number;
  allowComplete?: boolean;
  disabled?: boolean;
  busy?: boolean;
  availableFlags?: MaterialFlagOption[];
  assignedFlagCodes?: string[];
  subTaskCategoryId?: string | null;
  requiresMaterialFlagsOnFinish?: boolean;
  onRefreshFlags?: () => Promise<{
    flags: MaterialFlagOption[];
    categoryId: string | null;
    requiresMaterialFlagsOnFinish?: boolean;
  }>;
  onClose: () => void;
  onConfirm: (input: KioskExitInput) => void;
}

export function KioskExitSubtaskModal({
  open,
  title,
  onClose,
  ...formProps
}: KioskExitSubtaskModalProps) {
  return (
    <KioskExitModalShell
      open={open}
      title={title}
      onClose={onClose}
      disabled={formProps.disabled || formProps.busy}
    >
      <KioskExitSubtaskForm
        {...formProps}
        variant="modal"
        onCancel={onClose}
      />
    </KioskExitModalShell>
  );
}
