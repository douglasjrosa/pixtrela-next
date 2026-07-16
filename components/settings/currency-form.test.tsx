import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { CurrencyForm } from "./currency-form";

const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

const currencies = [
  {
    documentId: "cur-star",
    title: "Estrela",
    pluralTitle: "Estrelas",
    currencyPerSecond: 2,
  },
  {
    documentId: "cur-gem",
    title: "Gema",
    pluralTitle: "Gemas",
    currencyPerSecond: 0.5,
  },
];

describe("CurrencyForm", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
  });

  it("renders active-for-subtasks select with currency titles", () => {
    renderWithIntl(
      <CurrencyForm
        currencies={currencies}
        activeCurrencyDocumentId="cur-star"
        onSave={vi.fn()}
      />,
    );

    const select = screen.getByLabelText("Ativo para Subtarefas:");
    expect(select).toHaveValue("cur-star");
    expect(screen.getByRole("option", { name: "Estrela" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Gema" })).toBeInTheDocument();
  });

  it("renders a units-per-second field for each currency", () => {
    renderWithIntl(
      <CurrencyForm
        currencies={currencies}
        activeCurrencyDocumentId=""
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Estrelas por segundo:")).toHaveValue(2);
    expect(screen.getByLabelText("Gemas por segundo:")).toHaveValue(0.5);
  });

  it("shows empty state when there are no currencies", () => {
    renderWithIntl(
      <CurrencyForm
        currencies={[]}
        activeCurrencyDocumentId=""
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Nenhuma moeda cadastrada.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });

  it("calls onSave with active currency and rates", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CurrencyForm
        currencies={currencies}
        activeCurrencyDocumentId="cur-star"
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Ativo para Subtarefas:"), {
      target: { value: "cur-gem" },
    });
    fireEvent.change(screen.getByLabelText("Estrelas por segundo:"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Gemas por segundo:"), {
      target: { value: "1.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        currencyDocumentId: "cur-gem",
        rates: [
          { documentId: "cur-star", currencyPerSecond: 3 },
          { documentId: "cur-gem", currencyPerSecond: 1.25 },
        ],
      });
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Configurações salvas.");
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("shows error toast when onSave fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("forbidden"));
    renderWithIntl(
      <CurrencyForm
        currencies={currencies}
        activeCurrencyDocumentId=""
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith(
        "Não foi possível salvar as configurações.",
      );
    });
    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
