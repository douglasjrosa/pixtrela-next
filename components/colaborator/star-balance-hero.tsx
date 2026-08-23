import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

export interface StarBalanceHeroProps {
  balance: number;
  currencyLabel?: string;
}

export function StarBalanceHero({ balance, currencyLabel }: StarBalanceHeroProps) {
  const t = useTranslations("balance");
  const label = currencyLabel ?? t("stars");

  return (
    <div
      data-testid="star-balance-hero"
      className="rounded-2xl bg-[var(--star-gold-muted)] p-6 text-center text-foreground"
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        <Star className="size-6 fill-star-gold text-star-gold" aria-hidden />
        <p className="text-sm font-semibold uppercase tracking-wide">{t("heroLabel")}</p>
      </div>
      <p className="text-5xl font-bold tabular-nums">{balance}</p>
      <p className="mt-1 text-lg font-medium">{label}</p>
    </div>
  );
}
