import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { AwardManager } from "./award-manager";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const currencies = [
  { documentId: "c1", name: "star", title: "Estrela" },
];

const awards = [
  {
    documentId: "a1",
    name: "Arroz",
    values: [{ numberOf: 50, currencyDocumentId: "c1" }],
  },
];

const noopUpload = vi.fn().mockResolvedValue(1);

describe("AwardManager", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("renders award list with values", () => {
    renderWithIntl(
      <AwardManager
        awards={awards}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    expect(screen.getByText("Arroz")).toBeInTheDocument();
    expect(screen.getByText("50 Estrela")).toBeInTheDocument();
  });

  it("hides award form by default", () => {
    renderWithIntl(
      <AwardManager
        awards={[]}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("opens create modal when Novo prêmio is clicked", () => {
    renderWithIntl(
      <AwardManager
        awards={[]}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
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
  });

  it("opens edit modal when award name is clicked", () => {
    renderWithIntl(
      <AwardManager
        awards={awards}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Arroz" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Editar prêmio" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Arroz");
  });

  it("closes modal on cancel", () => {
    renderWithIntl(
      <AwardManager
        awards={awards}
        currencies={currencies}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Arroz" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates an award, closes modal and refreshes list", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithIntl(
      <AwardManager
        awards={[]}
        currencies={currencies}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onUploadImage={noopUpload}
        canDelete={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Novo prêmio" }));
    await user.type(screen.getByLabelText("Nome"), "Feijão");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Feijão",
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
