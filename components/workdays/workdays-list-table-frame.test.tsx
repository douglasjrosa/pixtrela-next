import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ListPageActionsProvider } from "@/components/ui/list-page-actions-slot";
import { renderWithIntl } from "@/test/test-utils";
import { WorkdayListProvider } from "./workday-list-context";
import { WorkdayListRowPresentational } from "./workday-list-row-presentational";
import { WorkdaysListTableFrame } from "./workdays-list-table-frame";
import type { WorkdayRow } from "./types";

const loadMoreWorkdays = vi.fn();
const bulkArchiveWorkdays = vi.fn();
const bulkReactivateWorkdays = vi.fn();
const bulkDeleteWorkdays = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/workdays/actions", () => ({
  loadMoreWorkdays: (...args: unknown[]) => loadMoreWorkdays(...args),
  bulkArchiveWorkdays: (...args: unknown[]) => bulkArchiveWorkdays(...args),
  bulkReactivateWorkdays: (...args: unknown[]) =>
    bulkReactivateWorkdays(...args),
  bulkDeleteWorkdays: (...args: unknown[]) => bulkDeleteWorkdays(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

const filters = {
  column: "name" as const,
  direction: "asc" as const,
  showArchived: false,
};

const activeRow: WorkdayRow = {
  documentId: "wd-1",
  name: "Expediente padrão",
  description: null,
  action: "work",
  scope: "global",
  timezone: "America/Sao_Paulo",
  validFrom: null,
  validUntil: null,
  active: true,
  teams: [],
  users: [],
  slots: [],
};

const labels = {
  actionLabel: "Trabalho",
  scopeLabel: "Global (todos)",
  validityLabel: "Contínua",
  slotsSummary: [],
  slotsCountLabel: "0 horários",
  inactiveLabel: "Inativo",
  selectRowLabel: "Selecionar Expediente padrão",
};

describe("WorkdaysListTableFrame", () => {
  beforeEach(() => {
    loadMoreWorkdays.mockReset();
    bulkArchiveWorkdays.mockReset();
    bulkReactivateWorkdays.mockReset();
    bulkDeleteWorkdays.mockReset();
    refresh.mockReset();
  });

  it("loads next page when Carregar mais is clicked", async () => {
    const user = userEvent.setup();
    loadMoreWorkdays.mockResolvedValueOnce({
      workdays: [
        {
          ...activeRow,
          documentId: "wd-2",
          name: "Feriado",
          action: "off",
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <ListPageActionsProvider>
        <WorkdayListProvider openEdit={vi.fn()}>
          <WorkdaysListTableFrame
            filters={filters}
            initialWorkdays={[activeRow]}
            initialPage={1}
            initialHasMore
            canDeactivate
            canDelete
            tableHeader={
              <thead>
                <tr>
                  <th>Nome</th>
                </tr>
              </thead>
            }
            tableBody={
              <tbody>
                <WorkdayListRowPresentational
                  workday={activeRow}
                  variant="table"
                  labels={labels}
                  showCheckboxColumn
                />
              </tbody>
            }
            mobileList={<ul />}
          />
        </WorkdayListProvider>
      </ListPageActionsProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Carregar mais" }));
    await waitFor(() =>
      expect(screen.getAllByText("Feriado").length).toBeGreaterThan(0),
    );
  });
});
