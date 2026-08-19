import Link from "next/link";
import { Package, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ExchangeWindowBanner } from "@/components/exchange/exchange-window-banner";
import {
  CartCheckoutForm,
  CartQtyForms,
  CartRemoveForm,
} from "@/components/store/cart-forms";
import { buttonVariants } from "@/components/ui/button";
import { canAffordCart } from "@/lib/domain/cart";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { loadCartPage } from "@/lib/store/load-cart-page";
import {
  buildStoreCartPath,
  buildStorePath,
} from "@/lib/store/store-path";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function StoreCartPage({ params }: PageProps) {
  const t = await getTranslations("cart");
  const session = await auth();
  const { documentId } = await params;

  if (session?.user?.role !== "colaborator" || !session.user.id) {
    redirect("/");
  }
  if (session.user.id !== documentId) {
    redirect(buildStoreCartPath(session.user.id));
  }

  const {
    items,
    total,
    spendableBalance,
    balance,
    windowOpen,
    team,
  } = await loadCartPage(documentId);

  const affordable = canAffordCart(spendableBalance, total);
  const remaining = Math.max(0, total - spendableBalance);
  const checkoutDisabled = !windowOpen || !affordable || items.length === 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">{t("title")}</h1>
        <Link
          href={buildStorePath(documentId)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {t("goToStore")}
        </Link>
      </div>

      {team ? (
        <ExchangeWindowBanner
          windowOpen={windowOpen}
          firstDay={team.exchangesFirstDay}
          lastDay={team.exchangesLastDay}
        />
      ) : null}

      {items.length === 0 ? (
        <div className="space-y-4 rounded-2xl border bg-card p-6 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href={buildStorePath(documentId)}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "min-h-12 rounded-2xl",
            )}
          >
            {t("goToStore")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => {
              const imageSrc = toBrowserMediaUrl(item.imageUrl);
              return (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-2xl border bg-card p-3"
                >
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageSrc}
                        alt={item.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Package className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-heading font-semibold">{item.title}</p>
                    <p className="flex items-center gap-1 text-sm text-[var(--star-gold-foreground)]">
                      <Star className="size-3.5 fill-star-gold text-star-gold" />
                      <span className="tabular-nums font-bold">
                        {item.unitCost}
                      </span>
                      <span className="text-muted-foreground">
                        · {t("lineTotal")}{" "}
                        <span className="tabular-nums font-semibold text-foreground">
                          {item.lineCost}
                        </span>
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CartQtyForms
                        itemId={item.id}
                        qty={item.qty}
                        stock={item.stock}
                      />
                      <CartRemoveForm itemId={item.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3 rounded-2xl bg-[var(--star-gold-muted)] p-4">
            <div className="flex justify-between text-sm">
              <span>{t("balance")}</span>
              <span className="tabular-nums font-semibold">
                {spendableBalance} {balance.currencyLabel}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-[var(--star-gold-foreground)]">
              <span>{t("total")}</span>
              <span className="tabular-nums">
                {total} {balance.currencyLabel}
              </span>
            </div>
            {!affordable && total > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("starsRemaining", { count: remaining })}
              </p>
            ) : null}
            {!windowOpen ? (
              <p className="text-sm text-destructive">
                {t("checkoutDisabledWindow")}
              </p>
            ) : null}
            <CartCheckoutForm disabled={checkoutDisabled} />
          </div>
        </>
      )}
    </section>
  );
}
