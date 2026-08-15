import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const changeUserPassword = vi.fn();
const updateUserPersonal = vi.fn();
const storeMedia = vi.fn();
const setUserAvatarMedia = vi.fn();
const getDb = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/repos/users", () => ({
  changeUserPassword: (...args: unknown[]) => changeUserPassword(...args),
  updateUserPersonal: (...args: unknown[]) => updateUserPersonal(...args),
  findUserAvatarUrl: vi.fn(),
  findUserById: vi.fn(),
  setUserAvatarMedia: (...args: unknown[]) => setUserAvatarMedia(...args),
}));

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => getDb(),
}));

describe("profile actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    changeUserPassword.mockReset();
    updateUserPersonal.mockReset();
    storeMedia.mockReset();
    setUserAvatarMedia.mockReset();
    getDb.mockReset();
  });

  it("rejects password change for admin", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });

    const { changeOwnPassword } = await import(
      "@/app/[documentId]/profile/actions"
    );
    const result = await changeOwnPassword({
      currentPassword: "oldpass1",
      password: "newpass1",
      passwordConfirmation: "newpass1",
    });
    expect(result).toEqual({ ok: false, error: "forbidden" });
  });

  it("stores avatar media for colaborator", async () => {
    authMock.mockResolvedValue({
      user: { id: "col-1", role: "colaborator" },
    });
    storeMedia.mockResolvedValue({
      storageKey: "avatars/col-1.jpg",
      url: "https://media.example.test/avatars/col-1.jpg",
      mimeType: "image/jpeg",
      byteSize: 12,
    });
    getDb.mockReturnValue({
      insert: () => ({
        values: () => ({
          returning: async () => [
            {
              id: "media-1",
              url: "https://media.example.test/avatars/col-1.jpg",
            },
          ],
        }),
      }),
    });

    const { updateOwnAvatar } = await import(
      "@/app/[documentId]/profile/actions"
    );
    const file = new File(["img"], "a.jpg", { type: "image/jpeg" });
    const result = await updateOwnAvatar(file);
    expect(result.ok).toBe(true);
    expect(storeMedia).toHaveBeenCalled();
    expect(setUserAvatarMedia).toHaveBeenCalledWith("col-1", "media-1");
  });

  it("updates personal data for colaborator", async () => {
    authMock.mockResolvedValue({
      user: { id: "col-1", role: "colaborator" },
    });
    updateUserPersonal.mockResolvedValue({
      name: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      phone: "11987654321",
    });

    const { updateOwnPersonal } = await import(
      "@/app/[documentId]/profile/actions"
    );
    const result = await updateOwnPersonal({
      name: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      phone: "(11) 98765-4321",
    });
    expect(result).toEqual({
      ok: true,
      name: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      phone: "11987654321",
    });
    expect(updateUserPersonal).toHaveBeenCalledWith({
      id: "col-1",
      name: "Ana",
      lastName: "Silva",
      phone: "(11) 98765-4321",
      email: "ana@example.com",
    });
  });

  it("changes password via drizzle repo", async () => {
    authMock.mockResolvedValue({
      user: { id: "col-1", role: "colaborator" },
    });
    changeUserPassword.mockResolvedValue("ok");

    const { changeOwnPassword } = await import(
      "@/app/[documentId]/profile/actions"
    );
    const result = await changeOwnPassword({
      currentPassword: "oldpass1",
      password: "newpass1",
      passwordConfirmation: "newpass1",
    });
    expect(result).toEqual({ ok: true });
    expect(changeUserPassword).toHaveBeenCalledWith({
      id: "col-1",
      currentPassword: "oldpass1",
      newPassword: "newpass1",
    });
  });
});
