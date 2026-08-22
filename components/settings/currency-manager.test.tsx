import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { CurrencyManager } from "./currency-manager";

const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const currencies = [
  {
    documentId: "cur-star",
    name: "star",
    title: "Estrela",
    pluralTitle: "Estrelas",
    iconMediaId: 11,
    iconMediaUrl: "https://cdn.example/star.png",
    currencyPerSecond: 2,
    active: true,
  },
  {
    documentId: "cur-gem",
    name: "gem",
    title: "Gema",
    pluralTitle: "Gemas",
    iconMediaId: null,
    iconMediaUrl: null,
    currencyPerSecond: 0.5,
    active: true,
  },
];

const onUploadIcon = vi.fn().mockResolvedValue(99);

describe("CurrencyManager", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    onUploadIcon.mockClear();
  });

  it("renders currencies in a tasks-like table", () => {
    renderWithIntl(
      <CurrencyManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onBulkArchive={vi.fn()}
        onBulkDelete={vi.fn()}
        onUploadIcon={onUploadIcon}
      />,
    );

    expect(screen.getByRole("heading", { name: "Moedas" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nova moeda" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Estrela").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gema").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.5").length).toBeGreaterThan(0);
  });

  it("shows empty state when there are no currencies", () => {
    renderWithIntl(
      <CurrencyManager
        currencies={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onBulkArchive={vi.fn()}
        onBulkDelete={vi.fn()}
        onUploadIcon={onUploadIcon}
      />,
    );

    expect(screen.getByText("Nenhuma moeda cadastrada.")).toBeInTheDocument();
  });

  it("creates a currency from the modal form", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CurrencyManager
        currencies={[]}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onBulkArchive={vi.fn()}
        onBulkDelete={vi.fn()}
        onUploadIcon={onUploadIcon}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nova moeda" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Nome"), {
      target: { value: "coin" },
    });
    fireEvent.change(within(dialog).getByLabelText("Título"), {
      target: { value: "Moeda" },
    });
    fireEvent.change(within(dialog).getByLabelText("Título no plural"), {
      target: { value: "Moedas" },
    });
    fireEvent.change(within(dialog).getByLabelText("Unidades por segundo"), {
      target: { value: "1.5" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        name: "coin",
        title: "Moeda",
        pluralTitle: "Moedas",
        iconMediaId: null,
        currencyPerSecond: 1.5,
      });
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Moeda salva.");
    expect(refresh).toHaveBeenCalled();
  });

  it("updates a currency when editing a row", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CurrencyManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        onBulkArchive={vi.fn()}
        onBulkDelete={vi.fn()}
        onUploadIcon={onUploadIcon}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Abrir Estrela" })[0]!);

    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Unidades por segundo"), {
      target: { value: "3" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("cur-star", {
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
        iconMediaId: 11,
        currencyPerSecond: 3,
      });
    });
  });

  it("does not show delete for the primary currency", () => {
    renderWithIntl(
      <CurrencyManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onBulkArchive={vi.fn()}
        onBulkDelete={vi.fn()}
        onUploadIcon={onUploadIcon}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Abrir Estrela" })[0]!);
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
  });

  it("deletes a non-primary currency after confirmation", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CurrencyManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        onBulkArchive={vi.fn()}
        onBulkDelete={vi.fn()}
        onUploadIcon={onUploadIcon}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Abrir Gema" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    const confirm = screen.getByRole("dialog", { name: "Excluir moeda" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("cur-gem");
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Moeda excluída.");
  });

  it("archives selected currencies after confirmation", async () => {
    const onBulkArchive = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CurrencyManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onBulkArchive={onBulkArchive}
        onBulkDelete={vi.fn()}
        onUploadIcon={onUploadIcon}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("checkbox", { name: "Selecionar Gema" })[0]!,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Arquivar selecionadas" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sim" }));

    await waitFor(() => {
      expect(onBulkArchive).toHaveBeenCalledWith(["cur-gem"]);
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Moedas arquivadas.");
  });

  it("hard-deletes when every selected currency is archived", async () => {
    const onBulkDelete = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <CurrencyManager
        currencies={[
          currencies[0]!,
          { ...currencies[1]!, active: false },
        ]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onBulkArchive={vi.fn()}
        onBulkDelete={onBulkDelete}
        onUploadIcon={onUploadIcon}
      />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Exibir moedas arquivadas" }),
    );
    expect(screen.getAllByText("Inativa").length).toBeGreaterThan(0);
    fireEvent.click(
      screen.getAllByRole("checkbox", { name: "Selecionar Gema" })[0]!,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Excluir selecionadas" }),
    );
    const confirm = screen.getByRole("dialog", { name: "Excluir moedas" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(onBulkDelete).toHaveBeenCalledWith(["cur-gem"]);
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Moedas excluídas.");
  });
});
