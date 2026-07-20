"use client";

import { useTranslations } from "next-intl";

import { AwardListRow } from "./award-list-row";
import type { AwardRow, CurrencyOption } from "./types";

export interface AwardsListViewProps {
  awards: AwardRow[];
  currencies: CurrencyOption[];
  onOpen: (award: AwardRow) => void;
}

export function AwardsListView({
  awards,
  currencies,
  onOpen,
}: AwardsListViewProps) {
  const tAwards = useTranslations("awards");

  if (awards.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-sm">{tAwards("empty")}</p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tAwards("name")}</th>
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
