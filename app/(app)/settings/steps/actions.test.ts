import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: {
    steps: "strapi:steps",
  },
  strapiFetch,
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags,
}));

function mockStrapiFetch(handlers: Record<string, unknown>): void {
  strapiFetch.mockImplementation(
    async (path: string, init?: { method?: string }) => {
      const method = init?.method ?? "GET";
      const key = `${method} ${path}`;
      if (key in handlers) {
        return handlers[key];
      }
      if (path in handlers) {
        return handlers[path];
      }
      throw new Error(`Unexpected strapiFetch: ${key}`);
    },
  );
}

describe("settings/steps/actions", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    vi.resetModules();
  });

  it("createStep appends at max index + 1", async () => {
    mockStrapiFetch({
      "GET /steps": { data: [{ index: 0 }, { index: 2 }] },
      "POST /steps": { data: { documentId: "s-new" } },
    });

    const { createStep } = await import("./actions");
    await createStep({ name: "Acabamento" });

    expect(strapiFetch).toHaveBeenCalledWith(
      "/steps",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ data: { name: "Acabamento", index: 3 } }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:steps");
  });

  it("createStep uses index 0 when no steps exist", async () => {
    mockStrapiFetch({
      "GET /steps": { data: [] },
      "POST /steps": { data: { documentId: "s-new" } },
    });

    const { createStep } = await import("./actions");
    await createStep({ name: "Fila" });

    expect(strapiFetch).toHaveBeenCalledWith(
      "/steps",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ data: { name: "Fila", index: 0 } }),
      }),
    );
  });

  it("updateStep PUTs name only", async () => {
    mockStrapiFetch({
      "PUT /steps/s1": { data: { documentId: "s1" } },
    });

    const { updateStep } = await import("./actions");
    await updateStep("s1", { name: "Produção" });

    expect(strapiFetch).toHaveBeenCalledWith(
      "/steps/s1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: { name: "Produção" } }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:steps");
  });

  it("reorderSteps updates sequential indexes for all steps", async () => {
    mockStrapiFetch({
      "GET /steps": {
        data: [{ documentId: "a" }, { documentId: "b" }, { documentId: "c" }],
      },
      "PUT /steps/a": { data: { documentId: "a" } },
      "PUT /steps/b": { data: { documentId: "b" } },
      "PUT /steps/c": { data: { documentId: "c" } },
    });

    const { reorderSteps } = await import("./actions");
    await reorderSteps(["c", "a", "b"]);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/steps/c",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: { index: 0 } }),
      }),
    );
    expect(strapiFetch).toHaveBeenCalledWith(
      "/steps/a",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: { index: 1 } }),
      }),
    );
    expect(strapiFetch).toHaveBeenCalledWith(
      "/steps/b",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: { index: 2 } }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:steps");
  });

  it("reorderSteps rejects mismatched id sets", async () => {
    mockStrapiFetch({
      "GET /steps": {
        data: [{ documentId: "a" }, { documentId: "b" }],
      },
    });

    const { reorderSteps } = await import("./actions");
    await expect(reorderSteps(["a", "c"])).rejects.toThrow("invalid_reorder");
  });
});
