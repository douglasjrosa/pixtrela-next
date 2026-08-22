import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { UserListProvider } from "./user-list-context";
import { UserListRowPresentational } from "./user-list-row-presentational";
import { UsersListTableFrame } from "./users-list-table-frame";
import type { UserRow } from "./types";

const loadMoreUsers = vi.fn();
const bulkDeactivateUsers = vi.fn();
const bulkDeleteUsers = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/users/actions", () => ({
  loadMoreUsers: (...args: unknown[]) => loadMoreUsers(...args),
  bulkDeactivateUsers: (...args: unknown[]) => bulkDeactivateUsers(...args),
  bulkDeleteUsers: (...args: unknown[]) => bulkDeleteUsers(...args),
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

function selectableBody(user = initialUsers[0]!) {
  return (
    <tbody>
      <UserListRowPresentational
        user={user}
        variant="table"
        labels={{
          role: user.roleType,
          selectRow: `Selecionar ${user.name}`,
        }}
        showCheckboxColumn
      />
    </tbody>
  );
}

describe("UsersListTableFrame", () => {
  beforeEach(() => {
    loadMoreUsers.mockReset();
    bulkDeactivateUsers.mockReset();
    bulkDeleteUsers.mockReset();
    showErrorToast.mockReset();
    showSuccessToast.mockReset();
    refresh.mockReset();
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

  it("deactivates selected users after confirmation", async () => {
    bulkDeactivateUsers.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithIntl(
      <UserListProvider openEdit={vi.fn()} canEdit={() => true}>
        <UsersListTableFrame
          filters={filters}
          initialUsers={initialUsers}
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
      </UserListProvider>,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Desativar selecionados" }),
    );
    expect(
      screen.getByText(/Tem certeza de que deseja desativar/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sim" }));

    await waitFor(() => {
      expect(bulkDeactivateUsers).toHaveBeenCalledWith(["u1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });

  it("deletes when all selected users are deactivated", async () => {
    bulkDeleteUsers.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const blocked = [{ ...initialUsers[0]!, blocked: true }];

    renderWithIntl(
      <UserListProvider openEdit={vi.fn()} canEdit={() => true}>
        <UsersListTableFrame
          filters={filters}
          initialUsers={blocked}
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
          tableBody={selectableBody(blocked[0]!)}
          mobileList={null}
        />
      </UserListProvider>,
    );

    await user.click(screen.getAllByRole("checkbox")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Excluir selecionados" }),
    );
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(bulkDeleteUsers).toHaveBeenCalledWith(["u1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });
});
