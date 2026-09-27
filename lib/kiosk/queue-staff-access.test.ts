import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppSession = vi.fn();
const assertKioskDeviceSession = vi.fn();

vi.mock("@/lib/auth/app-session", () => ({
  getAppSession: (...args: unknown[]) => getAppSession(...args),
}));

vi.mock("@/lib/business/kiosk-staff-access", () => ({
  assertKioskDeviceSession: (...args: unknown[]) =>
    assertKioskDeviceSession(...args),
  assertKioskStaffCanOpenQueue: vi.fn(),
  isKioskStaffRole: (role: string | undefined) =>
    role === "admin" || role === "manager" || role === "leader",
}));

vi.mock("@/lib/repos/kiosk", () => ({
  assertStaffCanOpenQueue: vi.fn(),
}));

import {
  assertQueueReader,
  assertQueueStaffMutation,
} from "./queue-staff-access";

describe("queue staff access for personal totem", () => {
  beforeEach(() => {
    getAppSession.mockReset();
    assertKioskDeviceSession.mockReset();
    assertKioskDeviceSession.mockResolvedValue(undefined);
  });

  it("lets a colaborator read and mutate only their own queue", async () => {
    getAppSession.mockResolvedValue({
      user: { id: "col-1", role: "colaborator" },
    });

    await expect(assertQueueReader("col-1")).resolves.toBeUndefined();
    await expect(assertQueueStaffMutation("col-1")).resolves.toBeUndefined();
    expect(assertKioskDeviceSession).not.toHaveBeenCalled();

    await expect(assertQueueStaffMutation("other")).rejects.toThrow("forbidden");
  });

  it("lets a leader operate their own queue without a device session", async () => {
    getAppSession.mockResolvedValue({
      user: { id: "lead-1", role: "leader" },
    });

    await expect(assertQueueReader("lead-1")).resolves.toBeUndefined();
    await expect(assertQueueStaffMutation("lead-1")).resolves.toBeUndefined();
    expect(assertKioskDeviceSession).not.toHaveBeenCalled();
  });

  it("still requires the factory kiosk device session for anonymous self-service", async () => {
    getAppSession.mockResolvedValue({ user: { id: "kiosk-1", role: "kiosk" } });
    await expect(assertQueueStaffMutation("col-1")).resolves.toBeUndefined();
    expect(assertKioskDeviceSession).toHaveBeenCalled();
  });
});
