"use client";

import { useTranslations } from "next-intl";

import { ArchiveReasonModal } from "@/components/ui/archive-reason-modal";

export interface ActivitiesBulkArchiveModalProps {
  open: boolean;
  disabled?: boolean;
  count?: number;
  onClose: () => void;
  onConfirm: (reasonForDeactivation: string) => void;
}

export function ActivitiesBulkArchiveModal({
  open,
  disabled = false,
  count = 2,
  onClose,
  onConfirm,
}: ActivitiesBulkArchiveModalProps) {
  const t = useTranslations("activities");

  return (
    <ArchiveReasonModal
      open={open}
      title={t("archiveTitle")}
      count={count}
      disabled={disabled}
      confirmLabel={t("archive")}
      titleId="activities-bulk-archive-title"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
