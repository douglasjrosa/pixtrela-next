import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { CurrencyBalance } from "./currency-balance";

describe("CurrencyBalance", () => {
  it("renders the balance breakdown", () => {
    renderWithIntl(
      <CurrencyBalance
        balance={120}
        previousBalance={80}
        totalIncome={50}
        totalOutcome={10}
      />,
    );

    expect(screen.getByTestId("previous")).toHaveTextContent("80");
    expect(screen.getByTestId("income")).toHaveTextContent("50");
    expect(screen.getByTestId("outcome")).toHaveTextContent("10");
    expect(screen.getByTestId("current")).toHaveTextContent("120");
  });
});
