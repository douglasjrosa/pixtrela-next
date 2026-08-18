import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { StoreRedeemSubmitButton } from "./store-redeem-submit-button";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return { ...actual, useTranslations: () => (key: string) => key };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormStatus: () => ({ pending: false, data: null, method: null, action: null }),
  };
});

describe("StoreRedeemSubmitButton", () => {
  it("disables when window closed, unaffordable, or out of stock", () => {
    const { rerender } = renderWithIntl(
      <form>
        <StoreRedeemSubmitButton windowOpen={false} affordable inStock />
      </form>,
    );
    expect(screen.getByRole("button")).toBeDisabled();

    rerender(
      <form>
        <StoreRedeemSubmitButton windowOpen affordable={false} inStock />
      </form>,
    );
    expect(screen.getByRole("button")).toBeDisabled();

    rerender(
      <form>
        <StoreRedeemSubmitButton windowOpen affordable inStock={false} />
      </form>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("enables when redeemable", () => {
    renderWithIntl(
      <form>
        <StoreRedeemSubmitButton windowOpen affordable inStock />
      </form>,
    );
    expect(screen.getByRole("button")).toBeEnabled();
  });
});
