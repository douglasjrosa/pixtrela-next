import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createUserRepo = vi.fn();
const updateUserAccount = vi.fn();
const deactivateUserRepo = vi.fn();
const hardDeleteUser = vi.fn();
const reactivateUser = vi.fn();
const findUserById = vi.fn();
const setUserTag = vi.fn();
const findUserIdByTag = vi.fn();
const setUserAvatarMedia = vi.fn();
const setUserFacePhotoMedia = vi.fn();
const storeMedia = vi.fn();
const insertMediaAsset = vi.fn();
const listUsers = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin", id: "admin-1" }, jwt: "" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/users", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repos/users")>(
    "@/lib/repos/users",
  );
  return {
    ...actual,
    createUser: (...args: unknown[]) => createUserRepo(...args),
    updateUserAccount: (...args: unknown[]) => updateUserAccount(...args),
    deactivateUser: (...args: unknown[]) => deactivateUserRepo(...args),
    hardDeleteUser: (...args: unknown[]) => hardDeleteUser(...args),
    reactivateUser: (...args: unknown[]) => reactivateUser(...args),
    setUserTag: (...args: unknown[]) => setUserTag(...args),
    findUserIdByTag: (...args: unknown[]) => findUserIdByTag(...args),
    setUserAvatarMedia: (...args: unknown[]) => setUserAvatarMedia(...args),
    setUserFacePhotoMedia: (...args: unknown[]) => setUserFacePhotoMedia(...args),
    listUsers: (...args: unknown[]) => listUsers(...args),
    findUserById: (...args: unknown[]) => findUserById(...args),
  };
});

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
}));

vi.mock("@/lib/repos/media", () => ({
  insertMediaAsset: (...args: unknown[]) => insertMediaAsset(...args),
}));

const loadUserListPageMock = vi.fn();

vi.mock("@/lib/users/load-user-list-page", () => ({
  loadUserListPage: (...args: unknown[]) => loadUserListPageMock(...args),
}));

describe("users/actions drizzle CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createUserRepo.mockReset();
    updateUserAccount.mockReset();
    deactivateUserRepo.mockReset();
    hardDeleteUser.mockReset();
    reactivateUser.mockReset();
    findUserById.mockReset();
    findUserById.mockResolvedValue({
      id: "u1",
      username: "maria.1",
      name: "Maria",
      role: "colaborator",
      code: 1,
      email: null,
      lastName: null,
      phone: null,
      blocked: false,
      active: true,
      greetingGender: "feminine",
    });
    setUserTag.mockReset();
    findUserIdByTag.mockReset();
    setUserAvatarMedia.mockReset();
    setUserFacePhotoMedia.mockReset();
    storeMedia.mockReset();
    insertMediaAsset.mockReset();
    loadUserListPageMock.mockReset();
    listUsers.mockResolvedValue([]);
  });

  it("loadMoreUsers parses filters and loads a page", async () => {
    loadUserListPageMock.mockResolvedValueOnce({
      users: [],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });
    const { loadMoreUsers } = await import("./actions");
    await loadMoreUsers({ column: "name", direction: "asc" }, 2);
    expect(loadUserListPageMock).toHaveBeenCalledWith(
      { q: undefined, column: "name", direction: "asc", showArchived: false },
      2,
    );
  });

  it("createUser persists via repo with null code", async () => {
    createUserRepo.mockResolvedValue({
      id: "u2",
      username: "ana",
      name: "Ana",
      role: "colaborator",
      code: null,
    });
    const { createUser } = await import("./actions");
    await createUser({
      name: "Ana",
      username: "ana",
      email: "ana@example.com",
      password: "secret1",
      code: null,
      roleType: "colaborator",
      greetingGender: "feminine",
    });
    expect(createUserRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ana",
        username: "ana",
        email: "ana@example.com",
        role: "colaborator",
        code: null,
      }),
    );
  });

  it("createUser persists via repo", async () => {
    createUserRepo.mockResolvedValue({
      id: "u1",
      username: "maria.1",
      name: "Maria",
      role: "colaborator",
      code: 1,
    });
    const { createUser } = await import("./actions");
    await createUser({
      name: "Maria",
      username: "maria.1",
      email: "maria@example.com",
      password: "secret1",
      code: 1,
      roleType: "colaborator",
      greetingGender: "feminine",
    });
    expect(createUserRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Maria",
        username: "maria.1",
        email: "maria@example.com",
        role: "colaborator",
        code: 1,
      }),
    );
  });

  it("deactivateUser soft-blocks via repo", async () => {
    const { deactivateUser } = await import("./actions");
    await deactivateUser("u1");
    expect(deactivateUserRepo).toHaveBeenCalledWith(
      "u1",
      expect.any(String),
    );
  });

  it("updateUser calls updateUserAccount", async () => {
    const { updateUser } = await import("./actions");
    await updateUser("u1", { name: "Maria Silva" });
    expect(updateUserAccount).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1", name: "Maria Silva" }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:users", "default");
  });

  it("deleteUser hard-deletes via repo for admin", async () => {
    const { deleteUser } = await import("./actions");
    await deleteUser("u1");
    expect(hardDeleteUser).toHaveBeenCalledWith("u1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:users", "default");
  });

  it("bulkDeactivateUsers deactivates each id", async () => {
    const { bulkDeactivateUsers } = await import("./actions");
    await bulkDeactivateUsers(["u1", "u2"]);
    expect(deactivateUserRepo).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:users", "default");
  });

  it("bulkDeleteUsers hard-deletes inactive users for admin", async () => {
    findUserById.mockResolvedValue({
      id: "u1",
      username: "maria.1",
      name: "Maria",
      role: "colaborator",
      code: 1,
      email: null,
      lastName: null,
      phone: null,
      blocked: true,
      active: false,
      greetingGender: "feminine",
    });
    const { bulkDeleteUsers } = await import("./actions");
    await bulkDeleteUsers(["u1"]);
    expect(hardDeleteUser).toHaveBeenCalledWith("u1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:users", "default");
  });

  it("bulkDeleteUsers allows blocked users still marked active", async () => {
    findUserById.mockResolvedValue({
      id: "u1",
      active: true,
      blocked: true,
    });
    const { bulkDeleteUsers } = await import("./actions");
    await bulkDeleteUsers(["u1"]);
    expect(hardDeleteUser).toHaveBeenCalledWith("u1");
  });

  it("bulkDeleteUsers rejects active users that are not blocked", async () => {
    findUserById.mockResolvedValue({
      id: "u1",
      active: true,
      blocked: false,
    });
    const { bulkDeleteUsers } = await import("./actions");
    await expect(bulkDeleteUsers(["u1"])).rejects.toThrow("activeUser");
    expect(hardDeleteUser).not.toHaveBeenCalled();
  });

  it("pairUserTag sets tag when no conflict", async () => {
    findUserIdByTag.mockResolvedValue(null);
    setUserTag.mockResolvedValue(undefined);
    const { pairUserTag } = await import("./actions");
    const result = await pairUserTag("u1", "  AB:CD  ");
    expect(result).toEqual({ ok: true, userTag: "ABCD" });
    expect(setUserTag).toHaveBeenCalledWith("u1", "ABCD");
  });

  it("pairUserTag returns conflict when tag owned elsewhere", async () => {
    findUserIdByTag.mockResolvedValue("other-user");
    const { pairUserTag } = await import("./actions");
    const result = await pairUserTag("u1", "AB:CD");
    expect(result).toEqual({ ok: false, error: "conflict" });
  });

  it("updateUserImage stores avatar media on drizzle", async () => {
    storeMedia.mockResolvedValue({
      storageKey: "k",
      url: "/a.jpg",
      mimeType: "image/jpeg",
      byteSize: 4,
    });
    insertMediaAsset.mockResolvedValue({ id: "media-1" });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["x"], "a.jpg", { type: "image/jpeg" }),
    );

    const { updateUserImage } = await import("./actions");
    await updateUserImage("u1", "avatar", formData);

    expect(insertMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ storageKey: "k" }),
      expect.objectContaining({
        category: "avatar",
        sensitivity: "internal",
      }),
    );
    expect(setUserAvatarMedia).toHaveBeenCalledWith("u1", "media-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:users", "default");
  });
});
