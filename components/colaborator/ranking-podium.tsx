"use client";

import { useTranslations } from "next-intl";

import type { RankingRow } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type RankingPodiumImageUrls = {
  1?: string | null;
  2?: string | null;
  3?: string | null;
};

const PODIUM_ALT_KEYS: Record<number, string> = {
  1: "podiumFirst",
  2: "podiumSecond",
  3: "podiumThird",
};

export interface RankingPodiumProps {
  topRows: RankingRow[];
  currentUserDocumentId: string;
  podiumImageUrls?: RankingPodiumImageUrls;
}

export function RankingPodium({
  topRows,
  currentUserDocumentId,
  podiumImageUrls = {},
}: RankingPodiumProps) {
  const t = useTranslations("dashboard");

  if (topRows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("rankingEmpty")}</p>;
  }

  return (
    <ol className="grid grid-cols-3 gap-2">
      {topRows.map((row) => {
        const imageUrl = podiumImageUrls[row.rank as 1 | 2 | 3] ?? null;
        const altKey = PODIUM_ALT_KEYS[row.rank];
        const isSelf = row.userDocumentId === currentUserDocumentId;
        return (
          <li
            key={row.userDocumentId}
            className={cn(
              "flex flex-col items-center rounded-2xl bg-[var(--rank-cosmic)] p-3 text-center text-white",
              isSelf && "ring-2 ring-star-gold",
            )}
          >
            {imageUrl && altKey ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 media URLs
              <img
                src={imageUrl}
                alt={t(altKey)}
                width={64}
                height={64}
                className="mb-2 size-14 object-contain"
              />
            ) : (
              <span className="mb-2 text-2xl font-bold">{row.rank}</span>
            )}
            <p className="line-clamp-2 text-xs font-semibold">{row.name}</p>
            <p className="mt-1 text-sm font-bold tabular-nums">{row.totalIncome}</p>
          </li>
        );
      })}
    </ol>
  );
}
