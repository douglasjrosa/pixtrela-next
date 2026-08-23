"use client";

import { Archive, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface BulkListToolbarProps {
  showArchive: boolean;
  showDelete: boolean;
  archiveLabel: string;
  deleteLabel: string;
  disabled?: boolean;
  onArchive: () => void;
  onDelete: () => void;
}

export function BulkListToolbar({
  showArchive,
  showDelete,
  archiveLabel,
  deleteLabel,
  disabled = false,
  onArchive,
  onDelete,
}: BulkListToolbarProps) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-end gap-2">
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
