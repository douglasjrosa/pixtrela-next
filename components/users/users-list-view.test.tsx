import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import type { UserRow } from "./types";
import { UsersListView } from "./users-list-view";

const users: UserRow[] = [
  {
    id: 1,
    documentId: "u1",
    name: "Maria",
    username: "maria.1234",
    code: 1234,
    roleType: "colaborator",
  },
  {
    id: 2,
    documentId: "u2",
    name: "Admin",
    username: "admin.1",
    code: 1,
    roleType: "admin",
  },
];

describe("UsersListView", () => {
  it("renders empty state", () => {
    renderWithIntl(
      <UsersListView
        users={[]}
        manageableRoles={["colaborator"]}
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("Nenhum usuário encontrado.")).toBeInTheDocument();
  });

  it("opens editable users via row link", () => {
    const onOpen = vi.fn();
    renderWithIntl(
      <UsersListView
        users={users}
        manageableRoles={["colaborator"]}
        onOpen={onOpen}
      />,
    );

    fireEvent.click(screen.getAllByRole("link", { name: "Maria" })[0]!);
    expect(onOpen).toHaveBeenCalledWith(users[0]);
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });
});
