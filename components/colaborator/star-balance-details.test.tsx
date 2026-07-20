import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { StarBalanceDetails } from "./star-balance-details";

describe("StarBalanceDetails", () => {
  it("hides breakdown until expanded", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <StarBalanceDetails
        previousBalance={80}
        totalIncome={50}
        totalOutcome={10}
        balance={120}
      />,
    );

    expect(screen.queryByTestId("previous")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ver detalhes/i }));

    expect(screen.getByTestId("previous")).toHaveTextContent("80");
    expect(screen.getByTestId("income")).toHaveTextContent("50");
    expect(screen.getByTestId("outcome")).toHaveTextContent("10");
    expect(screen.getByTestId("current")).toHaveTextContent("120");
  });
});
