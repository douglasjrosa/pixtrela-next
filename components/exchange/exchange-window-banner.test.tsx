import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { ExchangeWindowBanner } from "./exchange-window-banner";

describe("ExchangeWindowBanner", () => {
  it("shows open message when window is open", () => {
    renderWithIntl(
      <ExchangeWindowBanner windowOpen firstDay={3} lastDay={15} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/janela de trocas aberta/i);
  });

  it("shows closed message when window is closed", () => {
    renderWithIntl(
      <ExchangeWindowBanner windowOpen={false} firstDay={3} lastDay={15} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/disponíveis somente/i);
  });
});
