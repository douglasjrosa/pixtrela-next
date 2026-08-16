import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { UserListProvider } from "./user-list-context";
import { UserListRowPresentational } from "./user-list-row-presentational";
import type { UserRow } from "./types";

const users: UserRow[] = [
  {
    id: 1,
    documentId: "u1",
    name: "Maria",
    username: "maria.1234",
    code: 1234,
    roleType: "colaborator",
    avatarUrl: "/api/media/maria.jpg",
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

describe("UserListRowPresentational", () => {
  it("opens editable users via name button", () => {
    const onOpen = vi.fn();
    renderWithIntl(
      <UserListProvider
        openEdit={onOpen}
        canEdit={(user) => user.roleType === "colaborator"}
      >
        <table>
          <tbody>
            {users.map((user) => (
              <UserListRowPresentational
                key={user.documentId}
                user={user}
                variant="table"
                labels={{ role: user.roleType }}
              />
            ))}
          </tbody>
        </table>
      </UserListProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Maria" }));
    expect(onOpen).toHaveBeenCalledWith(users[0]);
    expect(screen.queryByRole("button", { name: "Admin" })).toBeNull();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("renders a circular avatar cell before the name column", () => {
    renderWithIntl(
      <UserListProvider openEdit={vi.fn()} canEdit={() => true}>
        <table>
          <tbody>
            <UserListRowPresentational
              user={users[0]!}
              variant="table"
              labels={{ role: "colaborator" }}
            />
          </tbody>
        </table>
      </UserListProvider>,
    );

    const avatar = screen.getAllByRole("img", { name: "Maria" })[0]!;
    expect(avatar).toHaveAttribute("src", "/api/media/maria.jpg");
    expect(avatar.className).toMatch(/rounded-full/);
  });
});
