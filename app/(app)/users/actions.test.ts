import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createUserRepo = vi.fn();
const updateUserAccount = vi.fn();
const deactivateUserRepo = vi.fn();
const setUserTag = vi.fn();
const findUserIdByTag = vi.fn();
const setUserAvatarMedia = vi.fn();
const setUserFacePhotoMedia = vi.fn();
const storeMedia = vi.fn();
const getDb = vi.fn();
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
    setUserTag: (...args: unknown[]) => setUserTag(...args),
    findUserIdByTag: (...args: unknown[]) => findUserIdByTag(...args),
    setUserAvatarMedia: (...args: unknown[]) => setUserAvatarMedia(...args),
    setUserFacePhotoMedia: (...args: unknown[]) => setUserFacePhotoMedia(...args),
    listUsers: (...args: unknown[]) => listUsers(...args),
    findUserById: vi.fn(async () => ({
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
    })),
  };
});

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
}));

const loadUserListPageMock = vi.fn();

vi.mock("@/lib/users/load-user-list-page", () => ({
  loadUserListPage: (...args: unknown[]) => loadUserListPageMock(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => getDb(),
}));

describe("users/actions drizzle CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createUserRepo.mockReset();
    updateUserAccount.mockReset();
    deactivateUserRepo.mockReset();
    setUserTag.mockReset();
    findUserIdByTag.mockReset();
    setUserAvatarMedia.mockReset();
    setUserFacePhotoMedia.mockReset();
    storeMedia.mockReset();
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
      { q: undefined, column: "name", direction: "asc" },
      2,
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
      password: "secret1",
      code: 1,
      roleType: "colaborator",
      greetingGender: "feminine",
    });
    expect(createUserRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Maria",
        username: "maria.1",
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

  it("deleteUser deactivates via repo for admin", async () => {
    const { deleteUser } = await import("./actions");
    await deleteUser("u1");
    expect(deactivateUserRepo).toHaveBeenCalledWith("u1", expect.any(String));
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:users", "default");
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
    const returning = vi.fn().mockResolvedValue([{ id: "media-1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });
    getDb.mockReturnValue({ insert });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["x"], "a.jpg", { type: "image/jpeg" }),
    );

    const { updateUserImage } = await import("./actions");
    await updateUserImage("u1", "avatar", formData);

    expect(setUserAvatarMedia).toHaveBeenCalledWith("u1", "media-1", expect.anything());
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:users", "default");
  });
});
