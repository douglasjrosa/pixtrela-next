import { describe, expect, it } from "vitest";

import type { MonthlyRankingData } from "./types";
import { monthlyRankingForViewer } from "./ranking-podium";

const RANKING: MonthlyRankingData = {
  month: "2026-09-01",
  currencies: [
    {
      id: 1,
      name: "star",
      title: "Estrela",
      pluralTitle: "Estrelas",
      rows: [
        { rank: 1, userDocumentId: "c1", name: "Ana", totalIncome: 50 },
        { rank: 2, userDocumentId: "c2", name: "Bia", totalIncome: 40 },
        { rank: 3, userDocumentId: "c3", name: "Caio", totalIncome: 30 },
        { rank: 4, userDocumentId: "c4", name: "Davi", totalIncome: 20 },
        { rank: 5, userDocumentId: "c5", name: "Eva", totalIncome: 10 },
      ],
    },
  ],
};

describe("monthlyRankingForViewer", () => {
  it("shows only the top three places to a colaborator", () => {
    const visible = monthlyRankingForViewer(RANKING, "colaborator");

    expect(visible.currencies[0]?.rows.map((row) => row.name)).toEqual([
      "Ana",
      "Bia",
      "Caio",
    ]);
  });

  it("keeps the full ranking for leader and above", () => {
    for (const role of ["leader", "manager", "admin"] as const) {
      const visible = monthlyRankingForViewer(RANKING, role);
      expect(visible.currencies[0]?.rows).toHaveLength(5);
    }
  });

  it("keeps a short colaborator ranking when fewer than three people scored", () => {
    const short: MonthlyRankingData = {
      month: RANKING.month,
      currencies: [
        {
          ...RANKING.currencies[0]!,
          rows: RANKING.currencies[0]!.rows.slice(0, 2),
        },
      ],
    };

    expect(
      monthlyRankingForViewer(short, "colaborator").currencies[0]?.rows,
    ).toHaveLength(2);
  });
});
