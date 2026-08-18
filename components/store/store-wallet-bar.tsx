import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

export interface StoreWalletBarProps {
  balance: number;
  currencyLabel: string;
}

export async function StoreWalletBar({
  balance,
  currencyLabel,
}: StoreWalletBarProps) {
  const t = await getTranslations("balance");

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
        <p className="truncate text-sm font-semibold uppercase tracking-wide text-[var(--star-gold-foreground)]">
          {t("heroLabel")}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold tabular-nums text-[var(--star-gold-foreground)]">
          {balance}
        </p>
        <p className="text-xs font-medium text-[var(--star-gold-foreground)]">
          {currencyLabel || t("stars")}
        </p>
      </div>
    </div>
  );
}
