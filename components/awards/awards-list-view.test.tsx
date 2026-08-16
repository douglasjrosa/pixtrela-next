import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import type { AwardRow, CurrencyOption } from "./types";
import { AwardsListView } from "./awards-list-view";

const currencies: CurrencyOption[] = [
  { documentId: "c1", name: "star", title: "Estrelas" },
];

const awards: AwardRow[] = [
  {
    documentId: "a1",
    name: "arroz-sku",
    title: "Arroz 5kg",
    active: true,
    stock: 0,
    imageUrl: "/api/media/arroz.jpg",
    values: [{ numberOf: 2100, currencyDocumentId: "c1" }],
  },
];

describe("AwardsListView", () => {
  it("shows title column header and circular award image", () => {
    renderWithIntl(
      <AwardsListView
        awards={awards}
        currencies={currencies}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Título").length).toBeGreaterThan(0);
    expect(screen.queryByRole("columnheader", { name: "Nome" })).toBeNull();

    const image = screen.getAllByRole("img", { name: "Arroz 5kg" })[0]!;
    expect(image).toHaveAttribute(
      "src",
      "/api/media/arroz.jpg",
    );
    expect(image.className).toMatch(/rounded-full/);
  });

  it("opens the award when the row is activated", () => {
    const onOpen = vi.fn();
    renderWithIntl(
      <AwardsListView
        awards={awards}
        currencies={currencies}
        onOpen={onOpen}
      />,
    );

    fireEvent.click(screen.getAllByRole("link", { name: "Arroz 5kg" })[0]!);
    expect(onOpen).toHaveBeenCalledWith(awards[0]);
  });
});
