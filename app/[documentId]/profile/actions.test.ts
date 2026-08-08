import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch: vi.fn(),
}));

describe("profile actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("rejects password change for admin", async () => {
    authMock.mockResolvedValue({
      jwt: "token",
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

  it("posts avatar for colaborator", async () => {
    authMock.mockResolvedValue({
      jwt: "token",
      user: { id: "col-1", role: "colaborator" },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ avatarUrl: "/uploads/a.jpg" }),
    });

    const { updateOwnAvatar } = await import(
      "@/app/[documentId]/profile/actions"
    );
    const file = new File(["img"], "a.jpg", { type: "image/jpeg" });
    const result = await updateOwnAvatar(file);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/profile/avatar"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("puts personal data for colaborator", async () => {
    authMock.mockResolvedValue({
      jwt: "token",
      user: { id: "col-1", role: "colaborator" },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: "Ana",
        lastName: "Silva",
        email: "ana@example.com",
        phone: "11987654321",
      }),
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
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/profile/personal"),
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
