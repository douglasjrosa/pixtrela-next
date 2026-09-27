import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppSession = vi.fn();
const assertKioskStaffCanManageColaborator = vi.fn();

vi.mock("@/lib/auth/app-session", () => ({
  getAppSession: (...args: unknown[]) => getAppSession(...args),
}));

vi.mock("@/lib/business/kiosk-staff-access", () => ({
  assertKioskStaffCanManageColaborator: (...args: unknown[]) =>
    assertKioskStaffCanManageColaborator(...args),
}));

describe("assertStaffColaboratorEditAccess", () => {
  beforeEach(() => {
    getAppSession.mockReset();
    assertKioskStaffCanManageColaborator.mockReset();
    assertKioskStaffCanManageColaborator.mockResolvedValue(undefined);
    vi.resetModules();
  });

  it("refuses an app staff session even for admin", async () => {
    getAppSession.mockResolvedValue({ user: { role: "admin", id: "admin-1" } });
    const { assertStaffColaboratorEditAccess } = await import(
      "./staff-colaborator-edit-access"
    );
    await expect(
      assertStaffColaboratorEditAccess("admin-1", "col-1"),
    ).rejects.toThrow("forbidden");
    expect(assertKioskStaffCanManageColaborator).not.toHaveBeenCalled();
  });

  it("allows a kiosk device session", async () => {
    getAppSession.mockResolvedValue({ user: { role: "kiosk" } });
    const { assertStaffColaboratorEditAccess } = await import(
      "./staff-colaborator-edit-access"
    );
    await expect(
      assertStaffColaboratorEditAccess("lead-1", "col-1"),
    ).resolves.toBeUndefined();
    expect(assertKioskStaffCanManageColaborator).toHaveBeenCalledWith(
      "lead-1",
      "col-1",
    );
  });
});
