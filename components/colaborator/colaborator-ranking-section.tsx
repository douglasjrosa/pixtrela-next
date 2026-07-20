import { useTranslations } from "next-intl";

import { RankingPodium } from "@/components/colaborator/ranking-podium";
import {
  primaryCurrencyRanking,
  resolveRankingPosition,
} from "@/lib/colaborator/ranking-position";
import type { MonthlyRankingData } from "@/lib/dashboard/types";
import { formatDatePtBr } from "@/lib/format/datetime";

export interface ColaboratorRankingSectionProps {
  ranking: MonthlyRankingData;
  userDocumentId: string;
}

export function ColaboratorRankingSection({
  ranking,
  userDocumentId,
}: ColaboratorRankingSectionProps) {
  const t = useTranslations("dashboard");
  const currency = primaryCurrencyRanking(ranking.currencies);

  if (!currency) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("rankingTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("rankingEmpty")}</p>
      </section>
    );
  }

  const position = resolveRankingPosition(currency.rows, userDocumentId);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t("rankingTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("rankingMonth", { month: formatDatePtBr(ranking.month) })}
        </p>
      </div>

      <RankingPodium
        topRows={position.topRows}
        currentUserDocumentId={userDocumentId}
      />

      {position.row ? (
        <div className="rounded-2xl border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">{t("yourPosition")}</p>
          <p className="text-3xl font-bold tabular-nums">{position.row.rank}º</p>
          <p className="mt-1 text-sm font-medium tabular-nums">
            {position.row.totalIncome} {currency.pluralTitle || currency.title}
          </p>
          {position.starsToNext !== null && position.starsToNext > 0 ? (
            <p className="mt-2 text-sm text-[var(--star-gold-foreground)]">
              {t("starsToNext", { count: position.starsToNext })}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
