import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const assertKioskStaffActor = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("@/lib/business/kiosk-staff-access", () => ({
  assertKioskStaffActor: (...args: unknown[]) => assertKioskStaffActor(...args),
}));

async function loadModule() {
  return import("./board-actor");
}

describe("board-actor", () => {
  beforeEach(() => {
    vi.resetModules();
    auth.mockReset();
    assertKioskStaffActor.mockReset();
  });

  it("requireAppBoardActor returns app actor from session", async () => {
    auth.mockResolvedValue({ user: { id: "u-1", role: "manager" } });
    const { requireAppBoardActor } = await loadModule();
    await expect(requireAppBoardActor()).resolves.toEqual({
      kind: "app",
      userId: "u-1",
      role: "manager",
    });
  });

  it("requireAppBoardActor rejects an unauthenticated session", async () => {
    auth.mockResolvedValue(null);
    const { requireAppBoardActor } = await loadModule();
    await expect(requireAppBoardActor()).rejects.toThrow("unauthorized");
  });

  it("requireKioskStaffBoardActor maps the kiosk staff actor", async () => {
    assertKioskStaffActor.mockResolvedValue({
      staffUserId: "leader-1",
      staffRole: "leader",
      name: "Ana",
      avatarUrl: null,
    });
    const { requireKioskStaffBoardActor } = await loadModule();
    await expect(requireKioskStaffBoardActor("leader-1")).resolves.toEqual({
      kind: "kiosk-staff",
      staffUserId: "leader-1",
      staffRole: "leader",
    });
    expect(assertKioskStaffActor).toHaveBeenCalledWith("leader-1");
  });

  it("requireKioskStaffBoardActor propagates access failures", async () => {
    assertKioskStaffActor.mockRejectedValue(new Error("forbidden"));
    const { requireKioskStaffBoardActor } = await loadModule();
    await expect(requireKioskStaffBoardActor("nope")).rejects.toThrow(
      "forbidden",
    );
  });

  it("assertBoardActorCanMove allows leader and above", async () => {
    const { assertBoardActorCanMove } = await loadModule();
    expect(() =>
      assertBoardActorCanMove({
        kind: "kiosk-staff",
        staffUserId: "l-1",
        staffRole: "leader",
      }),
    ).not.toThrow();
    expect(() =>
      assertBoardActorCanMove({ kind: "app", userId: "u", role: "admin" }),
    ).not.toThrow();
  });

  it("assertBoardActorCanMove blocks colaborator", async () => {
    const { assertBoardActorCanMove } = await loadModule();
    expect(() =>
      assertBoardActorCanMove({ kind: "app", userId: "u", role: "colaborator" }),
    ).toThrow("forbidden");
  });

  it("assertBoardActorCanManageSubtasks blocks non-staff roles", async () => {
    const { assertBoardActorCanManageSubtasks } = await loadModule();
    expect(() =>
      assertBoardActorCanManageSubtasks({
        kind: "app",
        userId: "u",
        role: "colaborator",
      }),
    ).toThrow("forbidden");
    expect(() =>
      assertBoardActorCanManageSubtasks({
        kind: "kiosk-staff",
        staffUserId: "l-1",
        staffRole: "leader",
      }),
    ).not.toThrow();
  });
});
