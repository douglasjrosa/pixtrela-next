import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

export interface StoreWalletBarProps {
  balance: number;
  currencyLabel: string;
  cartHref: string;
  cartItemCount: number;
}

export async function StoreWalletBar({
  balance,
  currencyLabel,
  cartHref,
  cartItemCount,
}: StoreWalletBarProps) {
  const tBalance = await getTranslations("balance");
  const tStore = await getTranslations("store");

  return (
    <div
      data-testid="store-wallet-bar"
      className={
        "sticky top-0 z-20 -mx-1 mb-2 flex items-center justify-between " +
        "gap-3 rounded-2xl bg-[var(--star-gold-muted)] px-4 py-3 shadow-sm"
      }
    >
      <div className="flex min-w-0 items-center gap-2">
        <Star
          className="size-5 shrink-0 fill-star-gold text-star-gold"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold uppercase tracking-wide text-[var(--star-gold-foreground)]">
            {tBalance("heroLabel")}
          </p>
          <p className="text-2xl font-bold tabular-nums text-[var(--star-gold-foreground)]">
            {balance}
            <span className="ml-1 text-xs font-medium">
              {currencyLabel || tBalance("stars")}
            </span>
          </p>
        </div>
      </div>
      <Link
        href={cartHref}
        className={
          "relative inline-flex min-h-11 items-center gap-2 rounded-2xl " +
          "bg-card px-3 py-2 text-sm font-semibold text-foreground " +
          "ring-1 ring-border"
        }
        aria-label={tStore("cartBadge")}
      >
        <ShoppingCart className="size-5" aria-hidden />
        <span className="hidden sm:inline">{tStore("viewCart")}</span>
        {cartItemCount > 0 ? (
          <span
            className={
              "absolute -right-1 -top-1 flex size-5 items-center justify-center " +
              "rounded-full bg-star-gold text-xs font-bold text-star-gold-foreground"
            }
          >
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
