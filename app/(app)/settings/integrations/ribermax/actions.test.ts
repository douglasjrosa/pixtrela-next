import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const upsertRibermaxConnection = vi.fn();
const getRibermaxConnection = vi.fn();
const probeRibermaxConnection = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/integrations/ribermax", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/integrations/ribermax")>();
  return {
    ...actual,
    upsertRibermaxConnection: (...args: unknown[]) =>
      upsertRibermaxConnection(...args),
    getRibermaxConnection: (...args: unknown[]) =>
      getRibermaxConnection(...args),
  };
});

vi.mock("@/integrations/ribermax/settings/test-connection", () => ({
  probeRibermaxConnection: (...args: unknown[]) =>
    probeRibermaxConnection(...args),
}));

describe("ribermax settings actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    upsertRibermaxConnection.mockReset();
    getRibermaxConnection.mockReset();
    probeRibermaxConnection.mockReset();
  });

  it("upserts connection credentials and revalidates", async () => {
    const { updateRibermaxConnection } = await import("./actions");
    const formData = new FormData();
    formData.set("baseUrl", "https://rbx.example");
    formData.set("token", "secret-token");
    const result = await updateRibermaxConnection(formData);
    expect(result).toEqual({ ok: true });
    expect(upsertRibermaxConnection).toHaveBeenCalledWith({
      baseUrl: "https://rbx.example",
      token: "secret-token",
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ribermax",
    );
  });

  it("tests saved connection credentials", async () => {
    getRibermaxConnection.mockResolvedValue({
      baseUrl: "https://rbx.example",
      token: "secret-token",
    });
    probeRibermaxConnection.mockResolvedValue(true);
    const { testRibermaxConnection } = await import("./actions");
    const result = await testRibermaxConnection();
    expect(result).toEqual({ ok: true });
    expect(probeRibermaxConnection).toHaveBeenCalled();
  });

  it("returns failure when probe fails", async () => {
    getRibermaxConnection.mockResolvedValue({
      baseUrl: "https://rbx.example",
      token: "secret-token",
    });
    probeRibermaxConnection.mockResolvedValue(false);
    const { testRibermaxConnection } = await import("./actions");
    const result = await testRibermaxConnection();
    expect(result).toEqual({ ok: false });
  });
});
