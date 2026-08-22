import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { AwardListProvider } from "./award-list-context";
import { AwardListRowPresentational } from "./award-list-row-presentational";
import type { AwardRow } from "./types";

const awards: AwardRow[] = [
  {
    documentId: "a1",
    name: "arroz-sku",
    title: "Arroz 5kg",
    active: true,
    showInStore: true,
    stock: 0,
    actualPrice: 0,
    autoRecalculate: true,
    imageUrl: "/api/media/arroz.jpg",
    values: [{ numberOf: 2100, currencyDocumentId: "c1" }],
  },
];

describe("AwardListRowPresentational", () => {
  it("shows circular award image and display title", () => {
    renderWithIntl(
      <AwardListProvider openEdit={vi.fn()}>
        <table>
          <tbody>
            <AwardListRowPresentational
              award={awards[0]!}
              variant="table"
              labels={{
                cost: "2100 Estrelas",
                actualPrice: "R$ 0,00",
                autoRecalculate: "Sim",
                stock: "0",
                showInStore: "Sim",
                inactive: "Inativo",
                selectRow: "Selecionar Arroz 5kg",
              }}
            />
          </tbody>
        </table>
      </AwardListProvider>,
    );

    const image = screen.getAllByRole("img", { name: "Arroz 5kg" })[0]!;
    expect(image).toHaveAttribute("src", "/api/media/arroz.jpg");
    expect(image.className).toMatch(/rounded-full/);
    expect(screen.getByRole("button", { name: "Arroz 5kg" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getAllByText("Sim")).toHaveLength(2);
  });

  it("opens the award when the title is clicked", () => {
    const onOpen = vi.fn();
    renderWithIntl(
      <AwardListProvider openEdit={onOpen}>
        <table>
          <tbody>
            <AwardListRowPresentational
              award={awards[0]!}
              variant="table"
              labels={{
                cost: "2100 Estrelas",
                actualPrice: "R$ 0,00",
                autoRecalculate: "Sim",
                stock: "0",
                showInStore: "Sim",
                inactive: "Inativo",
                selectRow: "Selecionar Arroz 5kg",
              }}
            />
          </tbody>
        </table>
      </AwardListProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Arroz 5kg" }));
    expect(onOpen).toHaveBeenCalledWith(awards[0]);
  });
});
