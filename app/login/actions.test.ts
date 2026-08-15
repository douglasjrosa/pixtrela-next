import { beforeEach, describe, expect, it, vi } from "vitest";

const identifyAppUsersByFace = vi.fn();
const findUserById = vi.fn();
const findUserAvatarUrl = vi.fn(async () => null);
const issueLoginTicket = vi.fn(() => "ticket-1");
vi.mock("@/lib/auth/login-ticket", () => ({
  issueLoginTicket: () => issueLoginTicket(),
}));

vi.mock("@/lib/repos/kiosk", () => ({
  identifyAppUsersByFace: (...args: unknown[]) =>
    identifyAppUsersByFace(...args),
  verifyUserFaceMatch: vi.fn(),
}));

vi.mock("@/lib/repos/users", () => ({
  authenticateUserByCode: vi.fn(),
  authenticateUserByTag: vi.fn(),
  findUserById: (...args: unknown[]) => findUserById(...args),
  findUserAvatarUrl: (...args: unknown[]) => findUserAvatarUrl(...args),
}));

describe("login/actions drizzle face", () => {
  beforeEach(() => {
    vi.resetModules();
    identifyAppUsersByFace.mockReset();
    findUserById.mockReset();
  });

  it("loginByFace issues loginTicket on unique match", async () => {
    identifyAppUsersByFace.mockResolvedValue({
      status: "match",
      match: {
        documentId: "user-1",
        name: "Maria",
        greetingGender: "feminine",
        avatarUrl: null,
        facePhotoUrl: null,
      },
    });
    findUserById.mockResolvedValue({
      id: "user-1",
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

    const { loginByFace } = await import("@/app/login/actions");
    const descriptor = Array.from({ length: 128 }, () => 0.1);
    const result = await loginByFace(descriptor);

    expect(result.ok).toBe(true);
    if (!result.ok || result.status !== "match") {
      throw new Error("expected match");
    }
    expect(result.loginTicket).toBe("ticket-1");
    expect(result.user.documentId).toBe("user-1");
  });
});
