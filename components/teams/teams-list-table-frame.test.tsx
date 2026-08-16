import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { TeamListProvider } from "./team-list-context";
import { TeamListRowPresentational } from "./team-list-row-presentational";
import { TeamsListTableFrame } from "./teams-list-table-frame";
import type { TeamRow } from "./types";

const loadMoreTeams = vi.fn();
const bulkArchiveTeams = vi.fn();
const bulkDeleteTeams = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/teams/actions", () => ({
  loadMoreTeams: (...args: unknown[]) => loadMoreTeams(...args),
  bulkArchiveTeams: (...args: unknown[]) => bulkArchiveTeams(...args),
  bulkDeleteTeams: (...args: unknown[]) => bulkDeleteTeams(...args),
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

const initialTeams: TeamRow[] = [
  {
    documentId: "t1",
    name: "Primeiro",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2026-01-10",
    untill: null,
    active: true,
    leader: { documentId: "l1", name: "João" },
    colaborators: [],
  },
];

const rowLabels = {
  since: "10/01/2026",
  untill: "",
  leader: "João",
  inactive: "Inativa",
  selectRow: "Selecionar Primeiro",
};

function selectableBody(team = initialTeams[0]!) {
  return (
    <tbody>
      <TeamListRowPresentational
        team={team}
        variant="table"
        labels={rowLabels}
        showCheckboxColumn
      />
    </tbody>
  );
}

describe("TeamsListTableFrame", () => {
  beforeEach(() => {
    loadMoreTeams.mockReset();
    bulkArchiveTeams.mockReset();
    bulkDeleteTeams.mockReset();
    showErrorToast.mockReset();
    showSuccessToast.mockReset();
    refresh.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreTeams.mockResolvedValueOnce({
      teams: [
        {
          documentId: "t2",
          name: "Segundo",
          exchangesFirstDay: 3,
          exchangesLastDay: 15,
          since: "2026-02-01",
          untill: null,
          active: true,
          leader: { documentId: "l1", name: "João" },
          colaborators: [],
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <TeamListProvider openEdit={vi.fn()}>
        <TeamsListTableFrame
          filters={filters}
          initialTeams={initialTeams}
          initialHasMore
          initialPage={1}
          tableHeader={
            <thead>
              <tr>
                <th>Nome</th>
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
      </TeamListProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreTeams).toHaveBeenCalledWith(filters, 2);
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
      <TeamListProvider openEdit={vi.fn()}>
        <TeamsListTableFrame
          filters={filters}
          initialTeams={initialTeams}
          initialHasMore
          initialPage={1}
          tableHeader={null}
          tableBody={null}
          mobileList={null}
        />
      </TeamListProvider>,
    );

    const button = screen.getByRole("button", { name: "Carregar mais" });
    expect(button.parentElement).toHaveClass("justify-center");
  });

  it("archives selected teams after simple confirmation", async () => {
    bulkArchiveTeams.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithIntl(
      <TeamListProvider openEdit={vi.fn()}>
        <TeamsListTableFrame
          filters={filters}
          initialTeams={initialTeams}
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
          tableBody={selectableBody()}
          mobileList={null}
        />
      </TeamListProvider>,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Arquivar selecionadas" }),
    );
    expect(
      screen.getByText(/Tem certeza de que deseja arquivar/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sim" }));

    await waitFor(() => {
      expect(bulkArchiveTeams).toHaveBeenCalledWith(["t1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });

  it("hard-deletes when all selected teams are archived", async () => {
    bulkDeleteTeams.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const archived = [{ ...initialTeams[0]!, active: false }];

    renderWithIntl(
      <TeamListProvider openEdit={vi.fn()}>
        <TeamsListTableFrame
          filters={{ ...filters, showArchived: true }}
          initialTeams={archived}
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
          tableBody={selectableBody(archived[0]!)}
          mobileList={null}
        />
      </TeamListProvider>,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Excluir selecionadas" }),
    );
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(bulkDeleteTeams).toHaveBeenCalledWith(["t1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });
});
