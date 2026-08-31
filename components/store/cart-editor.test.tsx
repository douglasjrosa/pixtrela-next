import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  STORE_CARD_WATERMARK_IMAGE_CLASS,
  STORE_CATALOG_CARD_WIDTH_CLASS,
  STORE_SUMMARY_CARD_WIDTH_CLASS,
  STORE_SUMMARY_ROW_CLASS,
} from "@/lib/store/store-layout";
import { renderWithIntl } from "@/test/test-utils";
import { CartEditor } from "./cart-editor";

const saveCartDraft = vi.fn();

vi.mock("@/app/[documentId]/store/actions", () => ({
  saveCartDraft: (...args: unknown[]) => saveCartDraft(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: vi.fn(),
}));

vi.mock("@/lib/ui/use-unsaved-leave-guard", () => ({
  useUnsavedLeaveGuard: vi.fn(),
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
      iconUrl: "/star.png",
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
  {
    currencyId: STAR,
    title: "Estrela",
    pluralTitle: "Estrelas",
    iconUrl: null,
    balance: 1000,
  },
  {
    currencyId: GEM,
    title: "Gema",
    pluralTitle: "Gemas",
    iconUrl: "/gem.png",
    balance: 200,
  },
  {
    currencyId: "44444444-4444-4444-8444-444444444444",
    title: "Coração",
    pluralTitle: "Corações",
    iconUrl: null,
    balance: 1,
  },
];

const UNSAVED_LEAVE_MESSAGE =
  "Tem certeza de que quer sair da página sem salvar?";

const defaultCartEditorProps = {
  initialAwards: [AWARD],
  currencies: CURRENCIES,
  unsavedLeaveMessage: UNSAVED_LEAVE_MESSAGE,
};

describe("CartEditor", () => {
  beforeEach(() => {
    saveCartDraft.mockReset();
    saveCartDraft.mockResolvedValue({ ok: true });
  });

  it("keeps save disabled until a qty changes and edits the selected currency", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CartEditor {...defaultCartEditorProps} />,
    );

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(saveButton).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Diminuir valor" }).parentElement,
    ).toHaveTextContent("1");

    await user.click(screen.getByDisplayValue(GEM));
    expect(
      screen.getByRole("button", { name: "Diminuir valor" }).parentElement,
    ).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(
      screen.getByRole("button", { name: "Diminuir valor" }).parentElement,
    ).toHaveTextContent("1");

    expect(screen.getAllByText("Seu saldo hoje")).toHaveLength(3);
    expect(screen.getAllByText("Resgate total")).toHaveLength(3);
    expect(screen.getAllByText("Saldo restante")).toHaveLength(3);
    expect(screen.queryByText("Saldo depois das trocas")).not.toBeInTheDocument();
    expect(screen.getByText("1.000 Estrelas")).toBeInTheDocument();
    expect(screen.getByText("200 Gemas")).toBeInTheDocument();
    expect(screen.getAllByText("1 Coração")).toHaveLength(2);
  });

  it("places awards and balances in horizontal catalog rows", () => {
    renderWithIntl(
      <CartEditor {...defaultCartEditorProps} />,
    );

    expect(screen.getByTestId("store-awards-row")).toHaveClass("overflow-x-auto");
    expect(screen.getByTestId("store-awards-row")).toHaveClass("w-full", "min-w-0");
    expect(screen.getByTestId("store-balances-row")).toHaveClass("flex-col");
    expect(screen.getByTestId("store-balances-row")).toHaveClass(
      ...STORE_SUMMARY_ROW_CLASS.split(" "),
    );
    expect(screen.getByTestId("store-awards-row").parentElement).toHaveClass(
      "overflow-x-hidden",
    );
    expect(screen.getByRole("list", { name: "Prêmios" })).toBe(
      screen.getByTestId("store-awards-row"),
    );
    expect(screen.getByRole("list", { name: "Saldos" })).toBe(
      screen.getByTestId("store-balances-row"),
    );
    const awardCard = screen.getByText("Estrela Vermelha").closest("li");
    expect(awardCard).toContainElement(
      screen.getByRole("button", { name: "Aumentar valor" }),
    );
    expect(awardCard).toHaveClass(...STORE_CATALOG_CARD_WIDTH_CLASS.split(" "));
    const balanceCard = screen.getByTestId("store-balances-row")
      .querySelector("li:last-child");
    expect(balanceCard).toHaveClass(
      ...STORE_SUMMARY_CARD_WIDTH_CLASS.split(" "),
    );
  });

  it("renders currency icons next to award price labels", () => {
    renderWithIntl(
      <CartEditor {...defaultCartEditorProps} />,
    );

    const awardsRow = screen.getByTestId("store-awards-row");
    const priceIcon = awardsRow.querySelector('img[src="/star.png"]');
    expect(priceIcon).not.toBeNull();
    expect(priceIcon).toHaveClass("size-4");
    // Gem falls back to currency.iconUrl from balances
    expect(awardsRow.querySelector('img[src="/gem.png"]')).not.toBeNull();
  });

  it("renders the currency icon as a small bottom-right watermark", () => {
    renderWithIntl(
      <CartEditor {...defaultCartEditorProps} />,
    );

    const images = screen.getByTestId("store-balances-row")
      .querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("src", "/gem.png");
    expect(images[0]).toHaveClass(
      ...STORE_CARD_WATERMARK_IMAGE_CLASS.split(" "),
    );
    expect(images[0]).toHaveClass("bottom-2", "right-2");
    expect(images[0]).toHaveStyle({ opacity: "0.7", maxWidth: "50%" });
  });

  it("renders summary slot before balance cards", () => {
    renderWithIntl(
      <CartEditor {...defaultCartEditorProps}>
        <li data-testid="summary-slot">Lista</li>
      </CartEditor>,
    );

    const row = screen.getByTestId("store-balances-row");
    const items = row.querySelectorAll(":scope > li");
    expect(items[0]).toHaveAttribute("data-testid", "summary-slot");
    expect(items[items.length - 1]).toHaveClass("bg-[var(--star-gold-muted)]");
  });

  it("hides save and qty controls when read-only", () => {
    renderWithIntl(
      <CartEditor
        {...defaultCartEditorProps}
        editable={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aumentar valor" }),
    ).not.toBeInTheDocument();
  });
});
