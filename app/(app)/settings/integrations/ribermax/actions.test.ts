import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const upsertBoxTemplateRates = vi.fn();

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
  const actual = await importOriginal<typeof import("@/integrations/ribermax")>();
  return {
    ...actual,
    upsertBoxTemplateRates: (...args: unknown[]) =>
      upsertBoxTemplateRates(...args),
  };
});

describe("ribermax settings actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
    upsertBoxTemplateRates.mockReset();
  });

  it("upserts box template rates and revalidates", async () => {
    const { updateRibermaxBoxTemplateRates } = await import("./actions");
    const formData = new FormData();
    formData.set("cutSeconds", "90");
    formData.set("adhesiveSeconds", "15");
    formData.set("fastenerSeconds", "2");
    await updateRibermaxBoxTemplateRates(formData);
    expect(upsertBoxTemplateRates).toHaveBeenCalledWith({
      cutSeconds: 90,
      adhesiveSeconds: 15,
      fastenerSeconds: 2,
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/settings/integrations/ribermax",
    );
    expect(redirect).toHaveBeenCalledWith("/settings/integrations/ribermax");
  });
});
