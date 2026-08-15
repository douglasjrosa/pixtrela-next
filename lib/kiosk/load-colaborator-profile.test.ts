import { describe, expect, it, vi } from "vitest";

const findUserById = vi.fn();
const findUserAvatarUrl = vi.fn();

vi.mock("@/lib/repos/users", () => ({
  findUserById: (...args: unknown[]) => findUserById(...args),
  findUserAvatarUrl: (...args: unknown[]) => findUserAvatarUrl(...args),
}));

vi.mock("@/lib/navigation/rethrow", () => ({
  rethrowIfNavigationError: () => undefined,
}));

describe("loadKioskColaboratorProfile", () => {
  it("returns colaborator profile with avatar url", async () => {
    findUserById.mockResolvedValue({
      id: "c1",
      name: "Ana Silva",
      role: "colaborator",
      active: true,
      blocked: false,
    });
    findUserAvatarUrl.mockResolvedValue("/api/media/ana.jpg");

    const { loadKioskColaboratorProfile } = await import(
      "./load-colaborator-profile"
    );
    await expect(loadKioskColaboratorProfile("c1")).resolves.toEqual({
      documentId: "c1",
      name: "Ana Silva",
      avatarUrl: "/api/media/ana.jpg",
    });
  });

  it("returns null when the profile is missing", async () => {
    findUserById.mockResolvedValue(null);
    const { loadKioskColaboratorProfile } = await import(
      "./load-colaborator-profile"
    );
    await expect(loadKioskColaboratorProfile("missing")).resolves.toBeNull();
  });
});
