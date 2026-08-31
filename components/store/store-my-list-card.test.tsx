import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { STORE_CARD_WATERMARK_IMAGE_CLASS } from "@/lib/store/store-layout";
import { createGetTranslationsMock } from "@/test/mock-next-intl-server";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next-intl/server", () => ({
  getTranslations: createGetTranslationsMock(),
}));

import { StoreMyListCard } from "./store-my-list-card";

describe("StoreMyListCard", () => {
  it("renders saved cart lines", async () => {
    const ui = await StoreMyListCard({
      items: [
        {
          awardId: "a1",
          title: "Arroz",
          imageUrl: null,
          lines: [
            {
              currencyId: "c1",
              qty: 2,
              label: "Estrelas",
              unitCost: 100,
              iconUrl: "/star.png",
            },
          ],
        },
      ],
    });
    renderWithIntl(ui);

    expect(screen.getByRole("heading", { name: "Minha lista" })).toBeInTheDocument();
    expect(screen.getByText("Arroz")).toBeInTheDocument();
    expect(screen.getByText("2")).toHaveClass("text-primary");
    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Minha lista" })).toHaveClass(
      "grid",
      "grid-cols-[auto_auto_minmax(0,1fr)]",
    );
    expect(screen.getByText("200 Estrelas")).toBeInTheDocument();
    expect(screen.getByRole("presentation")).toHaveAttribute("src", "/star.png");
  });

  it("renders the cart branding watermark behind the list", async () => {
    const ui = await StoreMyListCard({
      items: [],
      cartWatermark: {
        url: "/cart-wm.png",
        displayOpacity: 40,
        widthPercent: 60,
      },
    });
    renderWithIntl(ui);

    const watermark = screen.getByTestId("store-my-list-watermark");
    expect(watermark).toHaveAttribute("src", "/cart-wm.png");
    expect(watermark).toHaveClass(
      ...STORE_CARD_WATERMARK_IMAGE_CLASS.split(" "),
    );
    expect(watermark).toHaveStyle({ opacity: "0.4", maxWidth: "60%" });
  });

  it("applies cart branding background color to the card", async () => {
    const ui = await StoreMyListCard({
      items: [],
      cartWatermark: {
        url: null,
        backgroundColor: "#aabbcc",
        backgroundColorOpacity: 50,
      },
    });
    renderWithIntl(ui);

    const card = screen.getByTestId("store-my-list-card");
    expect(card).toHaveStyle({
      backgroundColor: "rgba(170, 187, 204, 0.5)",
    });
    expect(card).toHaveClass("bg-transparent");
  });

  it("shows an empty-state message when nothing is saved", async () => {
    const ui = await StoreMyListCard({ items: [] });
    renderWithIntl(ui);

    expect(
      screen.getByText("Nenhum prêmio salvo no carrinho."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("store-my-list-watermark")).toBeNull();
  });
});
