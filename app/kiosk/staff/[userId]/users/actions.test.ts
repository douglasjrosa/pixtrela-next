import { beforeEach, describe, expect, it, vi } from "vitest";

const assertStaffColaboratorEditAccess = vi.fn();
const setColaboratorPasswordByStaff = vi.fn();
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "kiosk" }, jwt: "jwt" })),
}));

vi.mock("@/lib/kiosk/staff-colaborator-edit-access", () => ({
  assertStaffColaboratorEditAccess: (...args: unknown[]) =>
    assertStaffColaboratorEditAccess(...args),
}));

vi.mock("@/lib/repos/users", () => ({
  setColaboratorPasswordByStaff: (...args: unknown[]) =>
    setColaboratorPasswordByStaff(...args),
  setUserAvatarMedia: vi.fn(),
  setUserFacePhotoMedia: vi.fn(),
}));

describe("kiosk staff users/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    assertStaffColaboratorEditAccess.mockReset();
    setColaboratorPasswordByStaff.mockReset();
    assertStaffColaboratorEditAccess.mockResolvedValue(undefined);
    setColaboratorPasswordByStaff.mockResolvedValue(undefined);
  });

  it("saveKioskColaboratorPassword updates drizzle user", async () => {
    const { saveKioskColaboratorPassword } = await import("./actions");
    const result = await saveKioskColaboratorPassword("staff-1", "col-1", {
      password: "newpass1",
      confirmPassword: "newpass1",
    });
    expect(result).toEqual({ ok: true });
    expect(assertStaffColaboratorEditAccess).toHaveBeenCalledWith(
      "staff-1",
      "col-1",
    );
    expect(setColaboratorPasswordByStaff).toHaveBeenCalledWith(
      "col-1",
      "newpass1",
    );
  });
});
