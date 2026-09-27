"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ListFilterModalShell } from "@/components/ui/list-filter-modal-shell";
import { cn } from "@/lib/utils";

const CHECKBOX_CLASS = "size-4 rounded border accent-primary";
const TITLE_ID = "currency-filter-modal-title";

export function CurrencyArchivedFilterModal({
  initialShowArchived,
  onClose,
  onApply,
}: {
  initialShowArchived: boolean;
  onClose: () => void;
  onApply: (showArchived: boolean) => void;
}) {
  const tSettings = useTranslations("settings");
  const [showArchived, setShowArchived] = useState(initialShowArchived);

  return (
    <ListFilterModalShell
      titleId={TITLE_ID}
      title={tSettings("currencyFilters")}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onApply(false);
              onClose();
            }}
          >
            {tSettings("currencyClearFilters")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(showArchived);
              onClose();
            }}
          >
            {tSettings("currencyApplyFilters")}
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
        {tSettings("showArchivedCurrencies")}
      </label>
    </ListFilterModalShell>
  );
}
