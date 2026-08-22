import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { createGetTranslationsMock } from "@/test/mock-next-intl-server";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next-intl/server", () => ({
  getTranslations: createGetTranslationsMock(),
}));

import { CurrencyForm } from "./currency-form";

const currencies = [
  {
    documentId: "cur-star",
    title: "Estrela",
    pluralTitle: "Estrelas",
  },
  {
    documentId: "cur-gem",
    title: "Gema",
    pluralTitle: "Gemas",
  },
];

describe("CurrencyForm", () => {
  it("renders active-for-subtasks select with currency titles", async () => {
    renderWithIntl(
      await CurrencyForm({
        currencies,
        activeCurrencyDocumentId: "cur-star",
        action: vi.fn(),
      }),
    );

    const select = screen.getByLabelText("Ativo para Subtarefas:");
    expect(select).toHaveValue("cur-star");
    expect(screen.getByRole("option", { name: "Estrela" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Gema" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Nenhuma" })).toBeNull();
  });

  it("defaults to the first currency when the assigned id is missing", async () => {
    renderWithIntl(
      await CurrencyForm({
        currencies,
        activeCurrencyDocumentId: "1d09980f-cb32-4cce-8bbb-99a6d2640651",
        action: vi.fn(),
      }),
    );

    expect(screen.getByLabelText("Ativo para Subtarefas:")).toHaveValue(
      "cur-star",
    );
    expect(
      screen.queryByRole("option", {
        name: "1d09980f-cb32-4cce-8bbb-99a6d2640651",
      }),
    ).toBeNull();
  });

  it("shows empty state when there are no currencies", async () => {
    renderWithIntl(
      await CurrencyForm({
        currencies: [],
        activeCurrencyDocumentId: "",
        action: vi.fn(),
      }),
    );

    expect(screen.getByText("Nenhuma moeda cadastrada.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });
});
