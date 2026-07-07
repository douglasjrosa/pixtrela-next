import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import type { MonthlyRankingData } from "@/lib/dashboard/types";

import { MonthlyRankingPanel } from "./monthly-ranking-panel";

const RANKING: MonthlyRankingData = {
  month: "2026-07-01",
  currencies: [
    {
      id: 1,
      name: "star",
      title: "Estrela",
      pluralTitle: "Estrelas",
      rows: [
        {
          rank: 1,
          userDocumentId: "c1",
          name: "Ana",
          totalIncome: 120,
        },
      ],
    },
  ],
};

describe("MonthlyRankingPanel", () => {
  it("renders ranking rows per currency", () => {
    renderWithIntl(
      <MonthlyRankingPanel
        month={RANKING.month}
        currencies={RANKING.currencies}
      />,
    );

    expect(screen.getByText("Estrelas")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });
});
