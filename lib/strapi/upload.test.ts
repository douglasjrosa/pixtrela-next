import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { strapiUpload } from "./upload";

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ jwt: "test-jwt" }),
}));

describe("strapiUpload", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 42, name: "photo.jpg" }],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns uploaded file id from array response", async () => {
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    await expect(strapiUpload(file)).resolves.toBe(42);
  });

  it("returns uploaded file id from single object response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 7, name: "photo.jpg" }),
      }),
    );
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    await expect(strapiUpload(file)).resolves.toBe(7);
  });

  it("throws when Strapi responds with error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: "Forbidden" } }),
      }),
    );
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    await expect(strapiUpload(file)).rejects.toThrow("upload failed (403)");
  });
});
