import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { AwardListProvider } from "./award-list-context";
import { AwardsListTableFrame } from "./awards-list-table-frame";
import type { AwardRow } from "./types";

const loadMoreAwards = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/awards/actions", () => ({
  loadMoreAwards: (...args: unknown[]) => loadMoreAwards(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

const filters = {
  column: "title" as const,
  direction: "asc" as const,
};

const currencies = [{ documentId: "c1", name: "star", title: "Estrela" }];

const initialAwards: AwardRow[] = [
  {
    documentId: "a1",
    name: "Primeiro",
    values: [{ numberOf: 10, currencyDocumentId: "c1" }],
  },
];

describe("AwardsListTableFrame", () => {
  beforeEach(() => {
    loadMoreAwards.mockReset();
    showErrorToast.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreAwards.mockResolvedValueOnce({
      awards: [
        {
          documentId: "a2",
          name: "Segundo",
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
});
