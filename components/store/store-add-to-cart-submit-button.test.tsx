import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { StoreAddToCartSubmitButton } from "./store-add-to-cart-submit-button";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return { ...actual, useTranslations: () => (key: string) => key };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormStatus: () => ({
      pending: false,
      data: null,
      method: null,
      action: null,
    }),
  };
});

describe("StoreAddToCartSubmitButton", () => {
  it("disables when out of stock or zero cost", () => {
    const { rerender } = renderWithIntl(
      <form>
        <StoreAddToCartSubmitButton inStock={false} hasCost />
      </form>,
    );
    expect(screen.getByRole("button")).toBeDisabled();

    rerender(
      <form>
        <StoreAddToCartSubmitButton inStock hasCost={false} />
      </form>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("enables when in stock with cost", () => {
    renderWithIntl(
      <form>
        <StoreAddToCartSubmitButton inStock hasCost />
      </form>,
    );
    expect(screen.getByRole("button")).toBeEnabled();
  });
});
