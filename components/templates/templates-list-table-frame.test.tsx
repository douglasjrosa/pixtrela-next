import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { TemplateListRowPresentational } from "./template-list-row-presentational";
import { TemplatesListTableFrame } from "./templates-list-table-frame";

const loadMoreTemplates = vi.fn();
const bulkArchiveTemplates = vi.fn();
const bulkDeleteTemplates = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/templates/template-task-actions", () => ({
  loadMoreTemplates: (...args: unknown[]) => loadMoreTemplates(...args),
  bulkArchiveTemplates: (...args: unknown[]) => bulkArchiveTemplates(...args),
  bulkDeleteTemplates: (...args: unknown[]) => bulkDeleteTemplates(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

const filters = {
  column: "name" as const,
  direction: "asc" as const,
  showArchived: false,
};

const initialTemplates = [
  {
    documentId: "tpl1",
    name: "Primeiro",
    code: "1",
    subTaskCount: 0,
    active: true,
  },
];

const rowLabels = {
  subTaskCountShort: "0 subtarefa(s)",
  inactive: "Inativo",
  selectRow: "Selecionar Primeiro",
};

describe("TemplatesListTableFrame", () => {
  beforeEach(() => {
    loadMoreTemplates.mockReset();
    bulkArchiveTemplates.mockReset();
    bulkDeleteTemplates.mockReset();
    showErrorToast.mockReset();
    showSuccessToast.mockReset();
    refresh.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreTemplates.mockResolvedValueOnce({
      templates: [
        {
          documentId: "tpl2",
          name: "Segundo",
          code: "2",
          subTaskCount: 1,
          active: true,
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <TemplatesListTableFrame
        filters={filters}
        initialTemplates={initialTemplates}
        initialHasMore
        initialPage={1}
        tableHeader={
          <thead>
            <tr>
              <th>Nome</th>
            </tr>
          </thead>
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreTemplates).toHaveBeenCalledWith(filters, 2);
    });
    await waitFor(() => {
      expect(
        screen.getAllByRole("link", { name: "Segundo" }).length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.queryByRole("button", { name: "Carregar mais" }),
    ).not.toBeInTheDocument();
  });

  it("centers the load more button", () => {
    renderWithIntl(
      <TemplatesListTableFrame
        filters={filters}
        initialTemplates={initialTemplates}
        initialHasMore
        initialPage={1}
        tableHeader={null}
      />,
    );

    const button = screen.getByRole("button", { name: "Carregar mais" });
    expect(button.parentElement).toHaveClass("justify-center");
  });

  it("archives selected templates after simple confirmation", async () => {
    bulkArchiveTemplates.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithIntl(
      <TemplatesListTableFrame
        filters={filters}
        initialTemplates={initialTemplates}
        initialHasMore={false}
        initialPage={1}
        canDeactivate
        tableHeader={
          <thead>
            <tr>
              <th>Nome</th>
            </tr>
          </thead>
        }
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(screen.getByRole("button", { name: "Arquivar selecionados" }));
    expect(
      screen.getByText(/Tem certeza de que deseja arquivar/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sim" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sim" }));

    await waitFor(() => {
      expect(bulkArchiveTemplates).toHaveBeenCalledWith(["tpl1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });

  it("hard-deletes when all selected templates are archived", async () => {
    bulkDeleteTemplates.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const archived = [{ ...initialTemplates[0]!, active: false }];

    renderWithIntl(
      <TemplatesListTableFrame
        filters={{ ...filters, showArchived: true }}
        initialTemplates={archived}
        initialHasMore={false}
        initialPage={1}
        canDelete
        tableHeader={
          <thead>
            <tr>
              <th>Nome</th>
            </tr>
          </thead>
        }
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(screen.getByRole("button", { name: "Excluir selecionados" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(bulkDeleteTemplates).toHaveBeenCalledWith(["tpl1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });
});

describe("TemplateListRowPresentational", () => {
  it("links the name to the template detail", () => {
    renderWithIntl(
      <table>
        <tbody>
          <TemplateListRowPresentational
            template={initialTemplates[0]!}
            variant="table"
            href="/templates/tasks/tpl1"
            labels={rowLabels}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByRole("link", { name: "Primeiro" })).toHaveAttribute(
      "href",
      "/templates/tasks/tpl1",
    );
  });
});
