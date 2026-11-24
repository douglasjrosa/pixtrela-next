import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const createPanelRepo = vi.fn();
const listPanelSlugs = vi.fn();
const auditSuccess = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/logs/record-log", () => ({
  auditSuccess: (...args: unknown[]) => auditSuccess(...args),
}));

vi.mock("@/lib/repos/panels", () => ({
  createPanel: (...args: unknown[]) => createPanelRepo(...args),
  listPanelSlugs: (...args: unknown[]) => listPanelSlugs(...args),
  findPanelById: vi.fn(),
  updatePanel: vi.fn(),
  archivePanels: vi.fn(),
  reactivatePanels: vi.fn(),
  deletePanels: vi.fn(),
}));

const STEP_ID = "11111111-1111-4111-8111-111111111111";
const TEAM_ID = "22222222-2222-4222-8222-222222222222";

describe("settings/panel/actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    createPanelRepo.mockReset();
    listPanelSlugs.mockReset();
    auditSuccess.mockReset();
  });

  it("creates a panel with a unique slug and revalidates", async () => {
    listPanelSlugs.mockResolvedValue(["montagem"]);
    createPanelRepo.mockResolvedValue({
      id: "p1",
      name: "Montagem",
      slug: "montagem-2",
    });

    const { createPanel } = await import("./actions");
    await createPanel({
      name: "Montagem",
      stepId: STEP_ID,
      teamIds: [TEAM_ID],
    });

    expect(createPanelRepo).toHaveBeenCalledWith({
      name: "Montagem",
      slug: "montagem-2",
      stepId: STEP_ID,
      teamIds: [TEAM_ID],
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:panels", "default");
  });
});
