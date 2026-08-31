import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

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

  it("shows an empty-state message when nothing is saved", async () => {
    const ui = await StoreMyListCard({ items: [] });
    renderWithIntl(ui);

    expect(
      screen.getByText("Nenhum prêmio salvo no carrinho."),
    ).toBeInTheDocument();
  });
});
