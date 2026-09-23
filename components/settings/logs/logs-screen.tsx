"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { LogsFiltersButton } from "@/components/settings/logs/logs-filters";
import { LogsListFrame } from "@/components/settings/logs/logs-list-frame";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { logListFilterKey } from "@/lib/logs/log-list-params";
import type { LogActorOption, LogListItem } from "@/lib/repos/logs";
import type { LogListFilters } from "@/lib/schemas/log-list-filters";

export function LogsScreen({
  initialFilters,
  initialItems,
  initialHasMore,
  actors,
}: {
  initialFilters: LogListFilters;
  initialItems: LogListItem[];
  initialHasMore: boolean;
  actors: LogActorOption[];
}) {
  const t = useTranslations("settings.logs");
  const serverKey = logListFilterKey(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [prevServerKey, setPrevServerKey] = useState(serverKey);
  if (serverKey !== prevServerKey) {
    setPrevServerKey(serverKey);
    setFilters(initialFilters);
    setItems(initialItems);
    setHasMore(initialHasMore);
  }

  return (
    <div className="space-y-3">
      <LogsFiltersButton
        filters={filters}
        actors={actors}
        onApplied={(next, result) => {
          setFilters(next);
          setItems(result.items);
          setHasMore(result.hasMore);
        }}
      />
      {items.length === 0 ? (
        <ListEmptyMessage>{t("empty")}</ListEmptyMessage>
      ) : (
        <LogsListFrame
          filters={filters}
          initialItems={items}
          initialHasMore={hasMore}
        />
      )}
    </div>
  );
}
