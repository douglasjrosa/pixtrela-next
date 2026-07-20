import Image from "next/image";
import { useTranslations } from "next-intl";

import type { RankingRow } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const PODIUM_ASSETS: Record<number, { src: string; altKey: string }> = {
  1: { src: "/images/ranking-antares-1st.svg", altKey: "podiumFirst" },
  2: { src: "/images/ranking-sirius-2nd.svg", altKey: "podiumSecond" },
  3: { src: "/images/ranking-vega-3rd.svg", altKey: "podiumThird" },
};

export interface RankingPodiumProps {
  topRows: RankingRow[];
  currentUserDocumentId: string;
}

export function RankingPodium({
  topRows,
  currentUserDocumentId,
}: RankingPodiumProps) {
  const t = useTranslations("dashboard");

  if (topRows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("rankingEmpty")}</p>;
  }

  return (
    <ol className="grid grid-cols-3 gap-2">
      {topRows.map((row) => {
        const asset = PODIUM_ASSETS[row.rank];
        const isSelf = row.userDocumentId === currentUserDocumentId;
        return (
          <li
            key={row.userDocumentId}
            className={cn(
              "flex flex-col items-center rounded-2xl bg-[var(--rank-cosmic)] p-3 text-center text-white",
              isSelf && "ring-2 ring-[var(--star-gold)]",
            )}
          >
            {asset ? (
              <Image
                src={asset.src}
                alt={t(asset.altKey)}
                width={64}
                height={64}
                className="mb-2 size-14"
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
