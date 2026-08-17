import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { UserListProvider } from "./user-list-context";
import { UsersListTableFrame } from "./users-list-table-frame";
import type { UserRow } from "./types";

const loadMoreUsers = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/users/actions", () => ({
  loadMoreUsers: (...args: unknown[]) => loadMoreUsers(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

const filters = {
  column: "name" as const,
  direction: "asc" as const,
};

const initialUsers: UserRow[] = [
  {
    id: "u1",
    documentId: "u1",
    name: "Primeiro",
    username: "primeiro.1",
    code: 1,
    roleType: "colaborator",
  },
];

describe("UsersListTableFrame", () => {
  beforeEach(() => {
    loadMoreUsers.mockReset();
    showErrorToast.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreUsers.mockResolvedValueOnce({
      users: [
        {
          id: "u2",
          documentId: "u2",
          name: "Segundo",
          username: "segundo.2",
          code: 2,
          roleType: "leader",
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <UserListProvider openEdit={vi.fn()} canEdit={() => true}>
        <UsersListTableFrame
          filters={filters}
          initialUsers={initialUsers}
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
      </UserListProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreUsers).toHaveBeenCalledWith(filters, 2);
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
      <UserListProvider openEdit={vi.fn()} canEdit={() => true}>
        <UsersListTableFrame
          filters={filters}
          initialUsers={initialUsers}
          initialHasMore
          initialPage={1}
          tableHeader={null}
          tableBody={null}
          mobileList={null}
        />
      </UserListProvider>,
    );

    const button = screen.getByRole("button", { name: "Carregar mais" });
    expect(button.parentElement).toHaveClass("justify-center");
  });
});
