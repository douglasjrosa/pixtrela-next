import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { MediaAssetRecord } from "@/lib/repos/media";
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
    exchangeRate: 1.5,
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
    exchangeRate: 0,
    active: true,
  },
];

const sampleIcon: MediaAssetRecord = {
  id: "00000000-0000-4000-8000-000000000099",
  storageKey: "icon.png",
  url: "/api/media/icon.png",
  browserUrl: "/api/media/icon.png",
  mimeType: "image/png",
  byteSize: 12,
  originalFilename: "star.png",
  displayName: "star",
  description: null,
  altText: null,
  title: null,
  category: "currency",
  sensitivity: "public",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const onListImages = vi.fn().mockResolvedValue([sampleIcon]);
const onUploadImage = vi.fn().mockResolvedValue(sampleIcon);

function renderManager(
  overrides: Partial<Parameters<typeof CurrencyManager>[0]> = {},
) {
  return renderWithIntl(
    <CurrencyManager
      currencies={currencies}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
      onDelete={vi.fn()}
      onBulkArchive={vi.fn()}
      onBulkDelete={vi.fn()}
      onListImages={onListImages}
      onUploadImage={onUploadImage}
      {...overrides}
    />,
  );
}

describe("CurrencyManager", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    onListImages.mockClear();
    onUploadImage.mockClear();
  });

  it("renders currencies in a tasks-like table", () => {
    renderManager();

    expect(screen.getByRole("heading", { name: "Moedas" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nova moeda" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Estrela").length).toBeGreaterThan(0);
    const icon = screen.getAllByRole("img", { name: "Estrela" })[0]!;
    expect(icon).toHaveAttribute("src", "https://cdn.example/star.png");
    expect(icon.className).toMatch(/rounded-full/);
    expect(screen.getAllByText("Gema").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.5").length).toBeGreaterThan(0);
  });

  it("shows empty state when there are no currencies", () => {
    renderManager({ currencies: [] });

    expect(screen.getByText("Nenhuma moeda cadastrada.")).toBeInTheDocument();
  });

  it("creates a currency from the modal form", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderManager({ currencies: [], onCreate });

    fireEvent.click(screen.getByRole("button", { name: "Nova moeda" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Taxa de câmbio")).toHaveValue(0);
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
        exchangeRate: 0,
      });
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Moeda salva.");
    expect(refresh).toHaveBeenCalled();
  });

  it("picks a library icon from the awards image picker", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderManager({ currencies: [], onCreate });

    await user.click(screen.getByRole("button", { name: "Nova moeda" }));
    const formDialog = screen.getByRole("dialog", { name: "Nova moeda" });
    await user.click(
      within(formDialog).getByRole("button", { name: "Escolher imagem" }),
    );
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "star.png" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "star.png" }));
    await user.click(screen.getByRole("button", { name: "Usar selecionada" }));

    fireEvent.change(within(formDialog).getByLabelText("Nome"), {
      target: { value: "coin" },
    });
    fireEvent.change(within(formDialog).getByLabelText("Título"), {
      target: { value: "Moeda" },
    });
    fireEvent.change(within(formDialog).getByLabelText("Título no plural"), {
      target: { value: "Moedas" },
    });
    fireEvent.click(within(formDialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          iconMediaId: sampleIcon.id,
        }),
      );
    });
  });

  it("updates a currency when editing a row", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderManager({ onUpdate });

    fireEvent.click(screen.getAllByRole("button", { name: "Abrir Estrela" })[0]!);

    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Unidades por segundo"), {
      target: { value: "3" },
    });
    fireEvent.change(within(dialog).getByLabelText("Taxa de câmbio"), {
      target: { value: "-0.25" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("cur-star", {
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
        iconMediaId: 11,
        currencyPerSecond: 3,
        exchangeRate: -0.25,
      });
    });
  });

  it("does not show delete for the assigned subtasks currency", () => {
    renderManager({ protectedCurrencyId: "cur-star" });

    fireEvent.click(screen.getAllByRole("button", { name: "Abrir Estrela" })[0]!);
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
  });

  it("deletes a non-primary currency after confirmation", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderManager({ onDelete });

    fireEvent.click(screen.getAllByRole("button", { name: "Abrir Gema" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    const confirm = screen.getByRole("dialog", { name: "Excluir moeda" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("cur-gem");
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Moeda excluída.");
  });

  it("archives the first-listed currency when another is assigned", async () => {
    const onBulkArchive = vi.fn().mockResolvedValue(undefined);
    renderManager({
      protectedCurrencyId: "cur-gem",
      onBulkArchive,
    });

    fireEvent.click(
      screen.getAllByRole("checkbox", { name: "Selecionar Estrela" })[0]!,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Arquivar selecionadas" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sim" }));

    await waitFor(() => {
      expect(onBulkArchive).toHaveBeenCalledWith(["cur-star"]);
    });
  });

  it("archives selected currencies after confirmation", async () => {
    const onBulkArchive = vi.fn().mockResolvedValue(undefined);
    renderManager({ onBulkArchive });

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
    renderManager({
      currencies: [currencies[0]!, { ...currencies[1]!, active: false }],
      onBulkDelete,
    });

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
