import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const upsertRibermaxConnection = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

vi.mock("@/integrations/ribermax", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/integrations/ribermax")>();
  return {
    ...actual,
    upsertRibermaxConnection: (...args: unknown[]) =>
      upsertRibermaxConnection(...args),
  };
});

describe("ribermax settings actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
    upsertRibermaxConnection.mockReset();
  });

  it("upserts connection credentials and revalidates", async () => {
    const { updateRibermaxConnection } = await import("./actions");
    const formData = new FormData();
    formData.set("baseUrl", "https://rbx.example");
    formData.set("token", "secret-token");
    await updateRibermaxConnection(formData);
    expect(upsertRibermaxConnection).toHaveBeenCalledWith({
      baseUrl: "https://rbx.example",
      token: "secret-token",
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ribermax",
    );
    expect(redirect).toHaveBeenCalledWith("/settings/integrations/ribermax");
  });
});
