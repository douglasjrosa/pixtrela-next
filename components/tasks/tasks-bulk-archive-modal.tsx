"use client";

import { useTranslations } from "next-intl";

import { ArchiveReasonModal } from "@/components/ui/archive-reason-modal";

export interface TasksBulkArchiveModalProps {
  open: boolean;
  disabled?: boolean;
  /** Number of selected tasks (drives min reason length). */
  count?: number;
  onClose: () => void;
  onConfirm: (reasonForDeactivation: string) => void;
}

export function TasksBulkArchiveModal({
  open,
  disabled = false,
  count = 2,
  onClose,
  onConfirm,
}: TasksBulkArchiveModalProps) {
  const tManage = useTranslations("tasks.manage");

  return (
    <ArchiveReasonModal
      open={open}
      title={tManage("archiveTitle")}
      count={count}
      disabled={disabled}
      confirmLabel={tManage("archive")}
      titleId="tasks-bulk-archive-title"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
