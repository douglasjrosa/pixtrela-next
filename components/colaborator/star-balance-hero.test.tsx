import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { StarBalanceHero } from "./star-balance-hero";

describe("StarBalanceHero", () => {
  it("renders large balance and currency label", () => {
    renderWithIntl(
      <StarBalanceHero balance={120} currencyLabel="Estrelas" />,
    );

    const hero = screen.getByTestId("star-balance-hero");
    expect(hero).toHaveTextContent("120");
    expect(hero).toHaveClass("text-foreground");
    expect(hero.className).not.toContain("star-gold-foreground");
    expect(screen.getByText("Estrelas")).toBeInTheDocument();
  });

  it("falls back to stars translation when label is missing", () => {
    renderWithIntl(<StarBalanceHero balance={0} />);

    expect(screen.getByText("Estrelas")).toBeInTheDocument();
  });
});
