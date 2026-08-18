import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { StoreFilter, StoreSort } from "@/lib/store/load-store-page";
import { cn } from "@/lib/utils";

export interface StoreFilterChipsProps {
  basePath: string;
  filter: StoreFilter;
  sort: StoreSort;
}

const FILTERS: StoreFilter[] = ["all", "affordable", "almost", "lowStock"];

/** Builds store catalog URLs from filter/sort search params. */
export function buildStoreCatalogHref(
  basePath: string,
  filter: StoreFilter,
  sort: StoreSort,
): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (sort !== "priceAsc") params.set("sort", sort);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function StoreFilterChips({
  basePath,
  filter,
  sort,
}: StoreFilterChipsProps) {
  const t = await getTranslations("store");

  const filterLabels: Record<StoreFilter, string> = {
    all: t("filterAll"),
    affordable: t("filterAffordable"),
    almost: t("filterAlmost"),
    lowStock: t("filterLowStock"),
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => {
          const active = entry === filter;
          return (
            <Link
              key={entry}
              href={buildStoreCatalogHref(basePath, entry, sort)}
              scroll={false}
              className={cn(
                "rounded-2xl px-3 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-star-gold text-star-gold-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {filterLabels[entry]}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("sortLabel")}</span>
        <Link
          href={buildStoreCatalogHref(basePath, filter, "priceAsc")}
          scroll={false}
          className={cn(
            "rounded-xl px-2.5 py-1.5 font-medium",
            sort === "priceAsc"
              ? "bg-card text-foreground ring-1 ring-border"
              : "text-muted-foreground",
          )}
        >
          {t("sortPriceAsc")}
        </Link>
        <Link
          href={buildStoreCatalogHref(basePath, filter, "priceDesc")}
          scroll={false}
          className={cn(
            "rounded-xl px-2.5 py-1.5 font-medium",
            sort === "priceDesc"
              ? "bg-card text-foreground ring-1 ring-border"
              : "text-muted-foreground",
          )}
        >
          {t("sortPriceDesc")}
        </Link>
      </div>
    </div>
  );
}
