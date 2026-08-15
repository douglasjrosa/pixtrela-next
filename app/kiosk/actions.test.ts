import { beforeEach, describe, expect, it, vi } from "vitest";

const identifyUserAtKioskByCode = vi.fn();
const loadKioskWelcomeProfile = vi.fn();
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "kiosk" }, jwt: "jwt" })),
}));

vi.mock("@/lib/repos/kiosk", () => ({
  identifyUserAtKioskByCode: (...args: unknown[]) =>
    identifyUserAtKioskByCode(...args),
  identifyUserAtKioskByTag: vi.fn(),
  identifyColaboratorsByFace: vi.fn(),
  loadKioskWelcomeProfile: (...args: unknown[]) =>
    loadKioskWelcomeProfile(...args),
}));

describe("kiosk/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    identifyUserAtKioskByCode.mockReset();
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
});
