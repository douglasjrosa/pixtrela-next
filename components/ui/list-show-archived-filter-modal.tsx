"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ListFilterModalShell } from "@/components/ui/list-filter-modal-shell";
import { listPathWithQuery } from "@/lib/ui/list-url";
import { cn } from "@/lib/utils";

const CHECKBOX_CLASS = "size-4 rounded border accent-primary";

export type ShowArchivedFilters = {
  showArchived: boolean;
};

export interface ListShowArchivedFilterModalProps<T extends ShowArchivedFilters> {
  titleId: string;
  title: string;
  showArchivedLabel: string;
  clearLabel: string;
  applyLabel: string;
  pathname: string;
  initialFilters: T;
  onClose: () => void;
  serializeFilters: (filters: T) => URLSearchParams;
}

export function ListShowArchivedFilterModal<T extends ShowArchivedFilters>({
  titleId,
  title,
  showArchivedLabel,
  clearLabel,
  applyLabel,
  pathname,
  initialFilters,
  onClose,
  serializeFilters,
}: ListShowArchivedFilterModalProps<T>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showArchived, setShowArchived] = useState(initialFilters.showArchived);

  function applyFilters(nextArchived: boolean): void {
    const params = serializeFilters({
      ...initialFilters,
      showArchived: nextArchived,
    });
    startTransition(() => {
      router.replace(listPathWithQuery(pathname, params));
      onClose();
    });
  }

  return (
    <ListFilterModalShell
      titleId={titleId}
      title={title}
      disabled={isPending}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => applyFilters(false)}
          >
            {clearLabel}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => applyFilters(showArchived)}
          >
            {applyLabel}
          </Button>
        </>
      }
    >
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className={cn(CHECKBOX_CLASS)}
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
        />
        {showArchivedLabel}
      </label>
    </ListFilterModalShell>
  );
}
