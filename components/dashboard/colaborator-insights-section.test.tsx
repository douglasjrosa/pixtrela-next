import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { ColaboratorInsightsSection } from "./colaborator-insights-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const INSIGHTS = {
  colaboratorDocumentId: "c1",
  month: "2026-07-01",
  dailyIncomeByCurrency: [
    {
      currencyId: 1,
      days: [{ date: "2026-07-05", amount: 30 }],
    },
  ],
  previousMonthsByCurrency: [
    {
      currencyId: 1,
      months: [
        {
          month: "2026-06-01",
          totalIncome: 50,
          totalOutcome: 10,
          net: 40,
        },
      ],
    },
  ],
};

const CURRENCIES = [
  {
    id: 1,
    name: "star",
    title: "Estrela",
    pluralTitle: "Estrelas",
    rows: [],
  },
];

describe("ColaboratorInsightsSection", () => {
  it("renders a select for staff roles", () => {
    renderWithIntl(
      <ColaboratorInsightsSection
        mode="staff"
        role="manager"
        colaboratorOptions={[
          { documentId: "c1", name: "Ana", code: 1 },
          { documentId: "c2", name: "Bia", code: 2 },
        ]}
        selectedDocumentId="c1"
        selectedName="Ana"
        insights={INSIGHTS}
        currencyRankings={CURRENCIES}
      />,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("renders a label for colaborator self mode", () => {
    renderWithIntl(
      <ColaboratorInsightsSection
        mode="self"
        role="colaborator"
        colaboratorOptions={[]}
        selectedDocumentId="c1"
        selectedName="Ana"
        insights={INSIGHTS}
        currencyRankings={CURRENCIES}
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });
});
