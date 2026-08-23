import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { ShoppingListToolbar } from "./shopping-list-toolbar";

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

describe("ShoppingListToolbar", () => {
  beforeEach(() => {
    updateShoppingListPrices.mockReset();
    refresh.mockReset();
    updateShoppingListPrices.mockResolvedValue(undefined);
  });

  it("shows update prices button for admins when editable awards exist", () => {
    renderWithIntl(
      <ShoppingListToolbar
        lines={lines}
        batchId="batch-1"
        month={8}
        year={2026}
        canUpdatePrices
      />,
    );

    expect(
      screen.getByRole("button", { name: "Atualizar preços" }),
    ).toBeInTheDocument();
  });

  it("hides update prices button when user cannot manage awards", () => {
    renderWithIntl(
      <ShoppingListToolbar
        lines={lines}
        batchId="batch-1"
        month={8}
        year={2026}
        canUpdatePrices={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Atualizar preços" }),
    ).not.toBeInTheDocument();
  });

  it("opens modal with shopping list awards and saves prices", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <ShoppingListToolbar
        lines={lines}
        batchId="batch-1"
        month={8}
        year={2026}
        canUpdatePrices
      />,
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
