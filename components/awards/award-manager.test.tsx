import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { AwardListRowPresentational } from "./award-list-row-presentational";
import { AwardManager } from "./award-manager";
import type { AwardRow } from "./types";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const currencies = [
  { documentId: "c1", name: "star", title: "Estrela", exchangeRate: 0.5 },
];

const activeAward: AwardRow = {
  documentId: "a1",
  name: "Arroz",
  active: true,
  showInStore: true,
  stock: 10,
  actualPrice: 0,
  autoRecalculate: true,
  values: [{ numberOf: 50, currencyDocumentId: "c1" }],
};

const archivedAward: AwardRow = {
  ...activeAward,
  active: false,
};

const noopUpload = vi.fn().mockResolvedValue({
  id: "media-1",
  storageKey: "media-1.png",
  url: "/api/media/media-1.png",
  browserUrl: "/api/media/media-1.png",
  mimeType: "image/png",
  byteSize: 12,
  originalFilename: "award.png",
  displayName: null,
  description: null,
  altText: null,
  title: null,
  category: "award",
  sensitivity: "public",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
});
const noopListImages = vi.fn().mockResolvedValue([]);

function renderManager(overrides: Partial<Parameters<typeof AwardManager>[0]> = {}) {
  return renderWithIntl(
    <AwardManager
      currencies={currencies}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
      onArchive={vi.fn()}
      onHardDelete={vi.fn()}
      onListImages={noopListImages}
      onUploadImage={noopUpload}
      canDeactivate
      canDelete={false}
      {...overrides}
    >
      <table>
        <tbody>
          <AwardListRowPresentational
            award={activeAward}
            variant="table"
            labels={{
              cost: "50 Estrela",
              actualPrice: "R$ 0,00",
              autoRecalculate: "Sim",
              stock: "10",
              showInStore: "Sim",
              inactive: "Inativo",
              selectRow: "Selecionar Arroz",
            }}
          />
        </tbody>
      </table>
    </AwardManager>,
  );
}

describe("AwardManager", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("renders award list with values", () => {
    renderManager();
    expect(screen.getAllByText("Arroz").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50 Estrela").length).toBeGreaterThan(0);
  });

  it("hides award form by default", () => {
    renderWithIntl(
      <AwardManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onArchive={vi.fn()}
        onHardDelete={vi.fn()}
        onListImages={noopListImages}
        onUploadImage={noopUpload}
        canDelete={false}
      >
        {null}
      </AwardManager>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("opens create modal when Novo prêmio is clicked", () => {
    renderWithIntl(
      <AwardManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onArchive={vi.fn()}
        onHardDelete={vi.fn()}
        onListImages={noopListImages}
        onUploadImage={noopUpload}
        canDelete={false}
      >
        {null}
      </AwardManager>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Novo prêmio" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Novo prêmio" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Valores")).toBeInTheDocument();
    expect(screen.getByText("Estrela")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adicionar valor" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Avisos")).toBeInTheDocument();
    expect(screen.getByText("Imagem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Escolher imagem" })).toBeInTheDocument();
    expect(screen.getByText("Mostrar na loja")).toBeInTheDocument();
    expect(screen.getByText("Recalcular automaticamente")).toBeInTheDocument();
    expect(screen.getByLabelText("Custo (R$)")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantidade em estoque")).toBeInTheDocument();
  });

  it("opens edit modal when award name is clicked", () => {
    renderManager();
    fireEvent.click(screen.getAllByRole("button", { name: "Arroz" })[0]!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Editar prêmio" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Arroz");
  });

  it("recalculates currency values when actual price changes with auto recalculate on", async () => {
    const user = userEvent.setup();
    renderManager();

    fireEvent.click(screen.getAllByRole("button", { name: "Arroz" })[0]!);
    const actualPriceInput = screen.getByLabelText("Custo (R$)");
    await user.clear(actualPriceInput);
    await user.type(actualPriceInput, "12.5");

    await waitFor(() => {
      expect(screen.getByLabelText("Estrela")).toHaveValue(625);
    });
  });

  it("shows archive action for active awards when canDeactivate is true", () => {
    renderManager({ canDeactivate: true, canDelete: false });
    fireEvent.click(screen.getAllByRole("button", { name: "Arroz" })[0]!);
    expect(screen.getByRole("button", { name: "Arquivar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("shows delete action for archived awards when canDelete is true", () => {
    renderWithIntl(
      <AwardManager
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onArchive={vi.fn()}
        onHardDelete={vi.fn()}
        onListImages={noopListImages}
        onUploadImage={noopUpload}
        canDeactivate={false}
        canDelete
      >
        <table>
          <tbody>
            <AwardListRowPresentational
              award={archivedAward}
              variant="table"
              labels={{
                cost: "50 Estrela",
                actualPrice: "R$ 0,00",
                stock: "10",
                showInStore: "Sim",
                inactive: "Inativo",
                selectRow: "Selecionar Arroz",
              }}
            />
          </tbody>
        </table>
      </AwardManager>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Arroz" })[0]!);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Arquivar" })).not.toBeInTheDocument();
  });

  it("closes modal on cancel", () => {
    renderManager();
    fireEvent.click(screen.getAllByRole("button", { name: "Arroz" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates an award, closes modal and refreshes list", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithIntl(
      <AwardManager
        currencies={currencies}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onArchive={vi.fn()}
        onHardDelete={vi.fn()}
        onListImages={noopListImages}
        onUploadImage={noopUpload}
        canDelete={false}
      >
        {null}
      </AwardManager>,
    );

    await user.click(screen.getByRole("button", { name: "Novo prêmio" }));
    await user.type(screen.getByLabelText("Nome"), "Feijão");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Feijão",
          showInStore: true,
          stock: 0,
          actualPrice: 0,
          autoRecalculate: true,
          values: [{ numberOf: 0, currencyDocumentId: "c1" }],
        }),
      );
    });
    expect(refresh).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
