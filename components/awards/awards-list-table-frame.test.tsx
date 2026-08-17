import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { AwardListProvider } from "./award-list-context";
import { AwardListRowPresentational } from "./award-list-row-presentational";
import { AwardsListTableFrame } from "./awards-list-table-frame";
import type { AwardRow } from "./types";

const loadMoreAwards = vi.fn();
const bulkArchiveAwards = vi.fn();
const bulkDeleteAwards = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/awards/actions", () => ({
  loadMoreAwards: (...args: unknown[]) => loadMoreAwards(...args),
  bulkArchiveAwards: (...args: unknown[]) => bulkArchiveAwards(...args),
  bulkDeleteAwards: (...args: unknown[]) => bulkDeleteAwards(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

const filters = {
  column: "title" as const,
  direction: "asc" as const,
  showArchived: false,
};

const currencies = [{ documentId: "c1", name: "star", title: "Estrela" }];

const initialAwards: AwardRow[] = [
  {
    documentId: "a1",
    name: "Primeiro",
    active: true,
    showInStore: true,
    stock: 0,
    values: [{ numberOf: 10, currencyDocumentId: "c1" }],
  },
];

const rowLabels = {
  cost: "10 Estrela",
  inactive: "Inativo",
  selectRow: "Selecionar Primeiro",
};

function selectableBody(award = initialAwards[0]!) {
  return (
    <tbody>
      <AwardListRowPresentational
        award={award}
        variant="table"
        labels={rowLabels}
        showCheckboxColumn
      />
    </tbody>
  );
}

describe("AwardsListTableFrame", () => {
  beforeEach(() => {
    loadMoreAwards.mockReset();
    bulkArchiveAwards.mockReset();
    bulkDeleteAwards.mockReset();
    showErrorToast.mockReset();
    showSuccessToast.mockReset();
    refresh.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreAwards.mockResolvedValueOnce({
      awards: [
        {
          documentId: "a2",
          name: "Segundo",
          active: true,
          showInStore: true,
          stock: 0,
          values: [{ numberOf: 20, currencyDocumentId: "c1" }],
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <AwardListProvider openEdit={vi.fn()}>
        <AwardsListTableFrame
          filters={filters}
          currencies={currencies}
          initialAwards={initialAwards}
          initialHasMore
          initialPage={1}
          tableHeader={
            <thead>
              <tr>
                <th>Título</th>
              </tr>
            </thead>
          }
          tableBody={
            <tbody>
              <tr>
                <td>Primeiro</td>
              </tr>
            </tbody>
          }
          mobileList={
            <ul>
              <li>Primeiro</li>
            </ul>
          }
        />
      </AwardListProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreAwards).toHaveBeenCalledWith(filters, 2);
    });
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "Segundo" }).length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.queryByRole("button", { name: "Carregar mais" }),
    ).not.toBeInTheDocument();
  });

  it("centers the load more button", () => {
    renderWithIntl(
      <AwardListProvider openEdit={vi.fn()}>
        <AwardsListTableFrame
          filters={filters}
          currencies={currencies}
          initialAwards={initialAwards}
          initialHasMore
          initialPage={1}
          tableHeader={null}
          tableBody={null}
          mobileList={null}
        />
      </AwardListProvider>,
    );

    const button = screen.getByRole("button", { name: "Carregar mais" });
    expect(button.parentElement).toHaveClass("justify-center");
  });

  it("archives selected awards after simple confirmation", async () => {
    bulkArchiveAwards.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithIntl(
      <AwardListProvider openEdit={vi.fn()}>
        <AwardsListTableFrame
          filters={filters}
          currencies={currencies}
          initialAwards={initialAwards}
          initialHasMore={false}
          initialPage={1}
          canDeactivate
          tableHeader={
            <thead>
              <tr>
                <th>Título</th>
              </tr>
            </thead>
          }
          tableBody={selectableBody()}
          mobileList={null}
        />
      </AwardListProvider>,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Arquivar selecionados" }),
    );
    expect(
      screen.getByText(/Tem certeza de que deseja arquivar/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sim" }));

    await waitFor(() => {
      expect(bulkArchiveAwards).toHaveBeenCalledWith(["a1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });

  it("hard-deletes when all selected awards are archived", async () => {
    bulkDeleteAwards.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const archived = [{ ...initialAwards[0]!, active: false }];

    renderWithIntl(
      <AwardListProvider openEdit={vi.fn()}>
        <AwardsListTableFrame
          filters={{ ...filters, showArchived: true }}
          currencies={currencies}
          initialAwards={archived}
          initialHasMore={false}
          initialPage={1}
          canDelete
          tableHeader={
            <thead>
              <tr>
                <th>Título</th>
              </tr>
            </thead>
          }
          tableBody={selectableBody(archived[0]!)}
          mobileList={null}
        />
      </AwardListProvider>,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Excluir selecionados" }),
    );
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(bulkDeleteAwards).toHaveBeenCalledWith(["a1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });
});
