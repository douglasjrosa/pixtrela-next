import { Package, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { StoreAddToCartForm } from "@/components/store/store-add-to-cart-form";
import type { StoreAwardView } from "@/lib/store/load-store-page";
import { STORE_LOW_STOCK_THRESHOLD } from "@/lib/store/load-store-page";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { cn } from "@/lib/utils";

export interface StoreProductCardProps {
  award: StoreAwardView;
  balance: number;
  compact?: boolean;
}

export async function StoreProductCard({
  award,
  balance,
  compact = false,
}: StoreProductCardProps) {
  const tExchange = await getTranslations("exchange");
  const tStore = await getTranslations("store");

  const inStock = award.stock > 0;
  const hasCost = award.cost > 0;
  const affordable = inStock && hasCost && balance >= award.cost;
  const remaining = Math.max(0, award.cost - balance);
  const progress = award.cost > 0 ? Math.min(1, balance / award.cost) : 0;
  const almost = inStock && hasCost && progress >= 0.7 && progress < 1;
  const lowStock = inStock && award.stock <= STORE_LOW_STOCK_THRESHOLD;
  const imageSrc = toBrowserMediaUrl(award.imageUrl);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm",
        compact && "min-w-[11rem] max-w-[14rem] shrink-0",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center bg-muted",
          compact ? "h-28" : "h-36",
        )}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- media host varies by env
          <img
            src={imageSrc}
            alt={tExchange("imageAlt", { title: award.title })}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="size-10 text-muted-foreground" aria-hidden />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {!inStock ? (
            <span className="rounded-lg bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
              {tStore("badgeOutOfStock")}
            </span>
          ) : affordable ? (
            <span className="rounded-lg bg-star-gold px-2 py-0.5 text-xs font-bold text-star-gold-foreground">
              {tStore("badgeRedeemable")}
            </span>
          ) : almost ? (
            <span className="rounded-lg bg-[var(--warning)] px-2 py-0.5 text-xs font-bold text-[var(--warning-foreground)]">
              {tStore("badgeAlmost")}
            </span>
          ) : null}
          {lowStock ? (
            <span className="rounded-lg bg-card/95 px-2 py-0.5 text-xs font-semibold text-foreground ring-1 ring-border">
              {tStore("badgeLowStock", { count: award.stock })}
            </span>
          ) : null}
        </div>
      </div>

      <div className={cn("space-y-2 p-3", !compact && "p-4")}>
        <h3
          className={cn(
            "font-heading font-semibold leading-snug",
            compact ? "text-sm" : "text-base",
          )}
        >
          {award.title}
        </h3>

        <p className="flex items-baseline gap-1 text-[var(--star-gold-foreground)]">
          <Star
            className="size-4 shrink-0 fill-star-gold text-star-gold"
            aria-hidden
          />
          <span className="text-xl font-bold tabular-nums">{award.cost}</span>
          <span className="text-xs font-medium text-muted-foreground">
            {award.currencyLabel || tExchange("cost")}
          </span>
        </p>

        {!affordable && inStock && hasCost ? (
          <div className="space-y-1">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-star-gold transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {tExchange("starsRemaining", { count: remaining })}
            </p>
          </div>
        ) : null}

        {!compact && (award.description || award.warnings) ? (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              {tStore("details")}
            </summary>
            <div className="mt-2 space-y-2 text-muted-foreground">
              {award.description ? <p>{award.description}</p> : null}
              {award.warnings ? (
                <p>
                  <span className="font-semibold text-foreground">
                    {tStore("warnings")}:{" "}
                  </span>
                  {award.warnings}
                </p>
              ) : null}
            </div>
          </details>
        ) : null}

        <StoreAddToCartForm
          awardId={award.id}
          inStock={inStock}
          hasCost={hasCost}
          compact={compact}
        />
      </div>
    </article>
  );
}
