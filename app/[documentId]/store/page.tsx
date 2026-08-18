import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ExchangeWindowBanner } from "@/components/exchange/exchange-window-banner";
import { StoreFeaturedRow } from "@/components/store/store-featured-row";
import { StoreFilterChips } from "@/components/store/store-filter-chips";
import { StoreProductGrid } from "@/components/store/store-product-grid";
import { StoreWalletBar } from "@/components/store/store-wallet-bar";
import {
  filterAndSortStoreAwards,
  loadStorePage,
  parseStoreFilter,
  parseStoreSort,
  pickFeaturedAwards,
} from "@/lib/store/load-store-page";
import { buildStorePath } from "@/lib/store/store-path";

interface PageProps {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ColaboratorStorePage({
  params,
  searchParams,
}: PageProps) {
  const tStore = await getTranslations("store");
  const tExchange = await getTranslations("exchange");
  const session = await auth();
  const { documentId } = await params;
  const query = await searchParams;

  if (session?.user?.role !== "colaborator" || !session.user.id) {
    redirect("/");
  }

  if (session.user.id !== documentId) {
    redirect(buildStorePath(session.user.id));
  }

  const filter = parseStoreFilter(firstParam(query.filter));
  const sort = parseStoreSort(firstParam(query.sort));
  const storePath = buildStorePath(documentId);

  const { balance, spendableBalance, awards, windowOpen, team } =
    await loadStorePage(documentId);

  const featured = pickFeaturedAwards(awards);
  const catalog = filterAndSortStoreAwards(
    awards,
    spendableBalance,
    filter,
    sort,
  );

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{tStore("title")}</h1>

      <StoreWalletBar
        balance={balance.balance}
        currencyLabel={balance.currencyLabel ?? ""}
      />

      {team ? (
        <ExchangeWindowBanner
          windowOpen={windowOpen}
          firstDay={team.exchangesFirstDay}
          lastDay={team.exchangesLastDay}
        />
      ) : null}

      <StoreFeaturedRow
        awards={featured}
        balance={spendableBalance}
        windowOpen={windowOpen}
      />

      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">
          {tStore("catalog")}
        </h2>
        <StoreFilterChips
          basePath={storePath}
          filter={filter}
          sort={sort}
        />
        {awards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tExchange("emptyAwards")}
          </p>
        ) : (
          <StoreProductGrid
            awards={catalog}
            balance={spendableBalance}
            windowOpen={windowOpen}
          />
        )}
      </div>
    </section>
  );
}
