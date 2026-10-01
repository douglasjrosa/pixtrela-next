import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { ColaboratorDailyGain } from "./colaborator-daily-gain";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

describe("ColaboratorDailyGain", () => {
  it("formats today's gain in pt-BR", () => {
    renderWithIntl(
      <ColaboratorDailyGain
        insights={{
          colaboratorDocumentId: "c1",
          month: "2026-09-01",
          dailyIncomeByCurrency: [
            {
              currencyId: 1,
              days: [
                { date: todayIsoDate(), amount: 2.8000000000000003 },
              ],
            },
          ],
          previousMonthsByCurrency: [],
        }}
        currencyRankings={[
          {
            id: 1,
            name: "star",
            title: "Estrela",
            pluralTitle: "Estrelas",
            rows: [],
          },
        ]}
      />,
    );

    expect(screen.getByText("2,80")).toBeInTheDocument();
    expect(screen.getByText("Estrelas")).toBeInTheDocument();
  });
});
