"use client";

import { Archive, ArchiveRestore, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface BulkListToolbarProps {
  showArchive: boolean;
  showRestore?: boolean;
  showDelete: boolean;
  archiveLabel: string;
  restoreLabel?: string;
  deleteLabel: string;
  disabled?: boolean;
  onArchive: () => void;
  onRestore?: () => void;
  onDelete: () => void;
  showRefresh?: boolean;
  refreshLabel?: string;
  refreshPending?: boolean;
  onRefresh?: () => void;
}

export function BulkListToolbar({
  showArchive,
  showRestore = false,
  showDelete,
  archiveLabel,
  restoreLabel,
  deleteLabel,
  disabled = false,
  onArchive,
  onRestore,
  onDelete,
  showRefresh = false,
  refreshLabel,
  refreshPending = false,
  onRefresh,
}: BulkListToolbarProps) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-end gap-2">
      {showRefresh && onRefresh && refreshLabel ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={refreshLabel}
          disabled={disabled || refreshPending}
          onClick={onRefresh}
        >
          <RefreshCw
            aria-hidden
            className={refreshPending ? "animate-spin" : undefined}
          />
        </Button>
      ) : null}
      {showArchive ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={archiveLabel}
          disabled={disabled}
          onClick={onArchive}
        >
          <Archive aria-hidden />
        </Button>
      ) : null}
      {showRestore && onRestore && restoreLabel ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={restoreLabel}
          disabled={disabled}
          onClick={onRestore}
        >
          <ArchiveRestore aria-hidden />
        </Button>
      ) : null}
      {showDelete ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={deleteLabel}
          disabled={disabled}
          onClick={onDelete}
        >
          <Trash2 aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
