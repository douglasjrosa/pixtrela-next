import { beforeEach, describe, expect, it, vi } from "vitest";

const listUsersPage = vi.fn();

vi.mock("@/lib/repos/users", () => ({
  listUsersPage: (...args: unknown[]) => listUsersPage(...args),
}));

import { loadUserListPage } from "./load-user-list-page";

describe("loadUserListPage", () => {
  beforeEach(() => {
    listUsersPage.mockReset();
  });

  it("maps users and derives pagination", async () => {
    listUsersPage.mockResolvedValueOnce({
      items: [
        {
          id: "u1",
          username: "maria.1234",
          email: null,
          name: "Maria",
          lastName: null,
          phone: null,
          code: 1234,
          role: "colaborator",
          blocked: false,
          active: true,
          greetingGender: "feminine",
          avatarUrl: "/media/maria.jpg",
          facePhotoUrl: null,
        },
      ],
      total: 12,
    });

    const result = await loadUserListPage(
      { q: undefined, column: "name", direction: "asc", showArchived: false },
      1,
    );

    expect(listUsersPage).toHaveBeenCalledWith({
      q: undefined,
      page: 1,
      pageSize: 10,
      sort: { column: "name", direction: "asc" },
      showArchived: false,
    });
    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.users[0]).toMatchObject({
      documentId: "u1",
      name: "Maria",
      code: 1234,
      roleType: "colaborator",
      blocked: false,
    });
  });
});
