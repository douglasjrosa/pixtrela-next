import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { CartRemoveSubmitButton } from "./cart-form-buttons";

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

describe("CartRemoveSubmitButton", () => {
  it("renders a destructive trash icon with accessible label", () => {
    renderWithIntl(
      <form>
        <CartRemoveSubmitButton />
      </form>,
    );

    const button = screen.getByRole("button", { name: "remove" });
    expect(button).toHaveClass("text-destructive");
    expect(button.querySelector("svg")).toBeTruthy();
    expect(button).not.toHaveTextContent("remove");
  });
});
