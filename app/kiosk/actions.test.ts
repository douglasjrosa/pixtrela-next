import { beforeEach, describe, expect, it, vi } from "vitest";

const identifyUserAtKioskByCode = vi.fn();
const identifyAppUsersByFace = vi.fn();
const loadKioskWelcomeProfile = vi.fn();
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "kiosk" }, jwt: "jwt" })),
}));

vi.mock("@/lib/repos/kiosk", () => ({
  identifyUserAtKioskByCode: (...args: unknown[]) =>
    identifyUserAtKioskByCode(...args),
  identifyUserAtKioskByTag: vi.fn(),
  identifyColaboratorsByFace: vi.fn(),
  identifyAppUsersByFace: (...args: unknown[]) =>
    identifyAppUsersByFace(...args),
  loadKioskWelcomeProfile: (...args: unknown[]) =>
    loadKioskWelcomeProfile(...args),
}));

describe("kiosk/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    identifyUserAtKioskByCode.mockReset();
    identifyAppUsersByFace.mockReset();
    loadKioskWelcomeProfile.mockReset();
  });

  it("identifyKioskUserByCode returns drizzle path", async () => {
    identifyUserAtKioskByCode.mockResolvedValue({
      id: "col-uuid",
      role: "colaborator",
      name: "Ana",
      code: 42,
    });
    loadKioskWelcomeProfile.mockResolvedValue({
      name: "Ana",
      greetingGender: "feminine",
      avatarUrl: "/api/media/a.jpg",
      facePhotoUrl: null,
    });

    const { identifyKioskUserByCode } = await import("@/app/kiosk/actions");
    const result = await identifyKioskUserByCode(42, "secret1");

    expect(result).toEqual({
      ok: true,
      documentId: "col-uuid",
      role: "colaborator",
      path: "/kiosk/col-uuid",
      welcome: {
        name: "Ana",
        greetingGender: "feminine",
        avatarUrl: "/api/media/a.jpg",
        facePhotoUrl: null,
      },
    });
    expect(identifyUserAtKioskByCode).toHaveBeenCalledWith({
      code: 42,
      password: "secret1",
    });
  });

  it("identifyKioskUserByFace matches staff and colaborators", async () => {
    const descriptor = Array.from({ length: 128 }, (_, index) => index / 128);
    identifyAppUsersByFace.mockResolvedValue({
      status: "match",
      match: {
        documentId: "admin-1",
        name: "Admin",
        greetingGender: "masculine",
        avatarUrl: null,
        facePhotoUrl: "/api/media/a.jpg",
        role: "admin",
      },
    });

    const { identifyKioskUserByFace } = await import("@/app/kiosk/actions");
    const result = await identifyKioskUserByFace(descriptor);

    expect(identifyAppUsersByFace).toHaveBeenCalledWith(descriptor);
    expect(result).toEqual({
      ok: true,
      status: "match",
      path: "/kiosk/staff/admin-1",
      match: {
        documentId: "admin-1",
        name: "Admin",
        greetingGender: "masculine",
        avatarUrl: null,
        facePhotoUrl: "/api/media/a.jpg",
        role: "admin",
      },
    });
  });
});
