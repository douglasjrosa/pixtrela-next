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

const STAR = "22222222-2222-4222-8222-222222222222";
const GEM = "33333333-3333-4333-8333-333333333333";

const AWARD = {
  awardId: "11111111-1111-4111-8111-111111111111",
  title: "Estrela Vermelha",
  stock: 5,
  imageSrc: null,
  prices: [
    {
      currencyId: STAR,
      label: "Estrelas",
      iconUrl: null,
      unitCost: 100,
      qty: 0,
    },
    {
      currencyId: GEM,
      label: "Gemas",
      iconUrl: null,
      unitCost: 50,
      qty: 0,
    },
  ],
};

const CURRENCIES = [
  { currencyId: STAR, label: "Estrelas", iconUrl: null, balance: 1000 },
  { currencyId: GEM, label: "Gemas", iconUrl: null, balance: 200 },
];

describe("CartEditor", () => {
  beforeEach(() => {
    saveCartDraft.mockReset();
    saveCartDraft.mockResolvedValue({ ok: true });
  });

  it("keeps save disabled until a qty changes and edits the selected currency", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CartEditor initialAwards={[AWARD]} currencies={CURRENCIES} />,
    );

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "+" }));
    expect(saveButton).toBeEnabled();
    expect(screen.getByRole("button", { name: "−" }).parentElement)
      .toHaveTextContent("1");

    await user.click(screen.getByDisplayValue(GEM));
    expect(screen.getByRole("button", { name: "−" }).parentElement)
      .toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByRole("button", { name: "−" }).parentElement)
      .toHaveTextContent("1");
    expect(
      screen.getAllByText("Saldo depois das trocas").length,
    ).toBeGreaterThan(0);
  });

  it("hides save and qty controls when read-only", () => {
    renderWithIntl(
      <CartEditor
        initialAwards={[AWARD]}
        currencies={CURRENCIES}
        editable={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+" })).not.toBeInTheDocument();
  });
});
