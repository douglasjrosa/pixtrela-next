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
  { documentId: "c1", name: "star", title: "Estrela" },
];

const activeAward: AwardRow = {
  documentId: "a1",
  name: "Arroz",
  active: true,
  showInStore: true,
  stock: 10,
  values: [{ numberOf: 50, currencyDocumentId: "c1" }],
};

const archivedAward: AwardRow = {
  ...activeAward,
  active: false,
};

const noopUpload = vi.fn().mockResolvedValue(1);

function renderManager(overrides: Partial<Parameters<typeof AwardManager>[0]> = {}) {
  return renderWithIntl(
    <AwardManager
      currencies={currencies}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
      onArchive={vi.fn()}
      onHardDelete={vi.fn()}
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
    expect(screen.getByLabelText("Moeda")).toBeInTheDocument();
    expect(screen.getByLabelText("Avisos")).toBeInTheDocument();
    expect(screen.getByLabelText("Imagem")).toBeInTheDocument();
    expect(screen.getByText("Mostrar na loja")).toBeInTheDocument();
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
          values: [{ numberOf: 1, currencyDocumentId: "c1" }],
        }),
      );
    });
    expect(refresh).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
