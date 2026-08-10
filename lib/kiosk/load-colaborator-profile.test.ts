import { describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => false,
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { users: "strapi:users" },
  strapiFetch,
}));

vi.mock("@/lib/navigation/rethrow", () => ({
  rethrowIfNavigationError: () => undefined,
}));

describe("loadKioskColaboratorProfile", () => {
  it("maps profile avatar url through Strapi media helper", async () => {
    strapiFetch.mockResolvedValue({
      data: {
        documentId: "c1",
        name: "Ana Silva",
        avatarUrl: "/uploads/ana.jpg",
      },
    });

    const { loadKioskColaboratorProfile } = await import(
      "./load-colaborator-profile"
    );
    await expect(loadKioskColaboratorProfile("c1")).resolves.toEqual({
      documentId: "c1",
      name: "Ana Silva",
      avatarUrl: "http://127.0.0.1:1337/uploads/ana.jpg",
    });
  });

  it("returns null when the profile is missing", async () => {
    strapiFetch.mockResolvedValue({ data: null });
    const { loadKioskColaboratorProfile } = await import(
      "./load-colaborator-profile"
    );
    await expect(loadKioskColaboratorProfile("missing")).resolves.toBeNull();
  });
});
