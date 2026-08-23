import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { ShoppingUpdatePricesButton } from "./shopping-update-prices-button";

const updateShoppingListPrices = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/exchanges/[batchId]/actions", () => ({
  updateShoppingListPrices: (...args: unknown[]) =>
    updateShoppingListPrices(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const lines = [
  {
    awardId: "a1",
    awardTitle: "Estrela Azul",
    qty: 3,
    actualPrice: 10,
  },
  {
    awardId: null,
    awardTitle: "Sem id",
    qty: 1,
    actualPrice: 0,
  },
];

describe("ShoppingUpdatePricesButton", () => {
  beforeEach(() => {
    updateShoppingListPrices.mockReset();
    refresh.mockReset();
    updateShoppingListPrices.mockResolvedValue(undefined);
  });

  it("renders update prices button when editable awards exist", () => {
    renderWithIntl(
      <ShoppingUpdatePricesButton lines={lines} batchId="batch-1" />,
    );

    expect(
      screen.getByRole("button", { name: "Atualizar preços" }),
    ).toBeInTheDocument();
  });

  it("opens modal with shopping list awards and saves prices", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <ShoppingUpdatePricesButton lines={lines} batchId="batch-1" />,
    );

    await user.click(screen.getByRole("button", { name: "Atualizar preços" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Estrela Azul")).toBeInTheDocument();
    expect(screen.queryByText("Sem id")).not.toBeInTheDocument();

    const priceInput = screen.getByRole("spinbutton");
    fireEvent.change(priceInput, { target: { value: "15.5" } });
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(updateShoppingListPrices).toHaveBeenCalledWith("batch-1", {
        awards: [{ awardId: "a1", actualPrice: 15.5 }],
      });
    });
    expect(refresh).toHaveBeenCalled();
  });
});
