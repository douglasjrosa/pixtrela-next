"use client";

import { useTranslations } from "next-intl";

import { ListEmptyMessage } from "@/components/ui/list-empty-message";

import { AwardListRow } from "./award-list-row";
import type { AwardRow, CurrencyOption } from "./types";

export interface AwardsListViewProps {
  awards: AwardRow[];
  currencies: CurrencyOption[];
  onOpen?: (award: AwardRow) => void;
}

export function AwardsListView({
  awards,
  currencies,
  onOpen,
}: AwardsListViewProps) {
  const tAwards = useTranslations("awards");

  if (awards.length === 0) {
    return <ListEmptyMessage>{tAwards("empty")}</ListEmptyMessage>;
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="w-12 py-2 pr-3" aria-hidden />
            <th className="py-2">{tAwards("titleField")}</th>
            <th>{tAwards("starCost")}</th>
          </tr>
        </thead>
        <tbody>
          {awards.map((award) => (
            <AwardListRow
              key={award.documentId}
              award={award}
              currencies={currencies}
              variant="table"
              onOpen={onOpen}
            />
          ))}
        </tbody>
      </table>

      <ul className="md:hidden">
        {awards.map((award) => (
          <AwardListRow
            key={award.documentId}
            award={award}
            currencies={currencies}
            variant="mobile"
            onOpen={onOpen}
          />
        ))}
      </ul>
    </>
  );
}
