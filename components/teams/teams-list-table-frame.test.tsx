import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { TeamListProvider } from "./team-list-context";
import { TeamsListTableFrame } from "./teams-list-table-frame";
import type { TeamRow } from "./types";

const loadMoreTeams = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/teams/actions", () => ({
  loadMoreTeams: (...args: unknown[]) => loadMoreTeams(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

const filters = {
  column: "name" as const,
  direction: "asc" as const,
};

const initialTeams: TeamRow[] = [
  {
    documentId: "t1",
    name: "Primeiro",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2026-01-10",
    untill: null,
    leader: { documentId: "l1", name: "João" },
    colaborators: [],
  },
];

describe("TeamsListTableFrame", () => {
  beforeEach(() => {
    loadMoreTeams.mockReset();
    showErrorToast.mockReset();
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
});
