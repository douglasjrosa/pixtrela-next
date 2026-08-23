import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { CartEditor } from "./cart-editor";

const saveCartDraft = vi.fn();

vi.mock("@/app/[documentId]/store/actions", () => ({
  saveCartDraft: (...args: unknown[]) => saveCartDraft(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: vi.fn(),
}));

const ITEM = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Estrela Vermelha",
  qty: 2,
  stock: 5,
  imageSrc: null,
  unitCost: 100,
};

describe("CartEditor", () => {
  beforeEach(() => {
    saveCartDraft.mockReset();
    saveCartDraft.mockResolvedValue({ ok: true });
  });

  it("updates totals immediately and enables save only when dirty", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CartEditor
        initialItems={[ITEM]}
        spendableBalance={1000}
        currencyLabel="estrelas"
      />,
    );

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    expect(saveButton).toBeDisabled();
    expect(screen.getByText("200")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+" }));

    expect(saveButton).toBeEnabled();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
  });

  it("removes items locally and keeps save disabled until dirty", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CartEditor
        initialItems={[ITEM]}
        spendableBalance={1000}
        currencyLabel="estrelas"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(screen.getByText(/Nenhum item no carrinho/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });
});
