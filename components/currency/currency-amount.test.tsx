import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} data-testid="currency-icon" />
  ),
}));

import { CurrencyAmount } from "./currency-amount";

describe("CurrencyAmount", () => {
  it("renders the currency icon to the left of the amount", () => {
    render(
      <CurrencyAmount iconUrl="/api/media/star.png">
        <span>1500 Estrelas</span>
      </CurrencyAmount>,
    );

    const icon = screen.getByTestId("currency-icon");
    expect(icon).toHaveAttribute("src", "/api/media/star.png");
    expect(screen.getByText("1500 Estrelas")).toBeInTheDocument();
    expect(icon.compareDocumentPosition(screen.getByText("1500 Estrelas"))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("renders without an icon when the url is missing", () => {
    render(
      <CurrencyAmount iconUrl={null}>
        <span>945</span>
      </CurrencyAmount>,
    );

    expect(screen.queryByTestId("currency-icon")).not.toBeInTheDocument();
    expect(screen.getByText("945")).toBeInTheDocument();
  });
});
