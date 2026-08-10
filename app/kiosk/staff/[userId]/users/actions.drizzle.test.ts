import { beforeEach, describe, expect, it, vi } from "vitest";

const assertStaffCanManageColaborator = vi.fn();
const setColaboratorPasswordByStaff = vi.fn();
const isDrizzleBackend = vi.fn(() => true);

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "kiosk" }, jwt: "jwt" })),
}));

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => isDrizzleBackend(),
}));

vi.mock("@/lib/repos/kiosk", () => ({
  assertStaffCanManageColaborator: (...args: unknown[]) =>
    assertStaffCanManageColaborator(...args),
}));

vi.mock("@/lib/repos/users", () => ({
  setColaboratorPasswordByStaff: (...args: unknown[]) =>
    setColaboratorPasswordByStaff(...args),
  setUserAvatarMedia: vi.fn(),
  setUserFacePhotoMedia: vi.fn(),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch: vi.fn(),
}));

describe("kiosk staff users/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    isDrizzleBackend.mockReturnValue(true);
    assertStaffCanManageColaborator.mockReset();
    setColaboratorPasswordByStaff.mockReset();
    assertStaffCanManageColaborator.mockResolvedValue(undefined);
    setColaboratorPasswordByStaff.mockResolvedValue(undefined);
  });

  it("saveKioskColaboratorPassword updates drizzle user", async () => {
    const { saveKioskColaboratorPassword } = await import("./actions");
    const result = await saveKioskColaboratorPassword("staff-1", "col-1", {
      password: "newpass1",
      confirmPassword: "newpass1",
    });
    expect(result).toEqual({ ok: true });
    expect(assertStaffCanManageColaborator).toHaveBeenCalledWith(
      "staff-1",
      "col-1",
    );
    expect(setColaboratorPasswordByStaff).toHaveBeenCalledWith(
      "col-1",
      "newpass1",
    );
  });
});
