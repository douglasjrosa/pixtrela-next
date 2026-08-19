import { getTranslations } from "next-intl/server";

import { StoreProductCard } from "@/components/store/store-product-card";
import type { StoreAwardView } from "@/lib/store/load-store-page";

export interface StoreFeaturedRowProps {
  awards: StoreAwardView[];
  balance: number;
}

export async function StoreFeaturedRow({
  awards,
  balance,
}: StoreFeaturedRowProps) {
  const t = await getTranslations("store");
  if (awards.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">{t("featured")}</h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {awards.map((award) => (
          <StoreProductCard
            key={award.id}
            award={award}
            balance={balance}
            compact
          />
        ))}
      </div>
    </section>
  );
}
