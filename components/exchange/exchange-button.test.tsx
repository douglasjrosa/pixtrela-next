import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { ExchangeButton } from "./exchange-button";

describe("ExchangeButton", () => {
  it("is disabled when the exchange window is closed", () => {
    renderWithIntl(<ExchangeButton windowOpen={false} affordable />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when the colaborator cannot afford the award", () => {
    renderWithIntl(<ExchangeButton windowOpen affordable={false} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("redeems when the window is open and affordable", () => {
    const onRedeem = vi.fn();
    renderWithIntl(<ExchangeButton windowOpen affordable onRedeem={onRedeem} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRedeem).toHaveBeenCalledTimes(1);
  });
});
