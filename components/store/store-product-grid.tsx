import { getTranslations } from "next-intl/server";

import { StoreProductCard } from "@/components/store/store-product-card";
import type { StoreAwardView } from "@/lib/store/load-store-page";

export interface StoreProductGridProps {
  awards: StoreAwardView[];
  balance: number;
  windowOpen: boolean;
}

export async function StoreProductGrid({
  awards,
  balance,
  windowOpen,
}: StoreProductGridProps) {
  const tExchange = await getTranslations("exchange");
  const tStore = await getTranslations("store");

  if (awards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {tStore("emptyFiltered")}
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="sr-only">{tExchange("title")}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {awards.map((award) => (
          <StoreProductCard
            key={award.id}
            award={award}
            balance={balance}
            windowOpen={windowOpen}
          />
        ))}
      </div>
    </section>
  );
}
