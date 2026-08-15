import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createTeamRepo = vi.fn();
const updateTeamRepo = vi.fn();
const deleteTeamRepo = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/teams", () => ({
  createTeam: (...args: unknown[]) => createTeamRepo(...args),
  updateTeam: (...args: unknown[]) => updateTeamRepo(...args),
  deleteTeam: (...args: unknown[]) => deleteTeamRepo(...args),
}));

describe("teams/actions drizzle CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createTeamRepo.mockReset();
    updateTeamRepo.mockReset();
    deleteTeamRepo.mockReset();
  });

  const form = {
    name: "Linha 1",
    exchangesFirstDay: 1,
    exchangesLastDay: 10,
    leaderDocumentId: "leader-1",
    colaboratorDocumentIds: ["c1"],
    untill: "",
  };

  it("createTeam persists via repo", async () => {
    const { createTeam } = await import("./actions");
    await createTeam(form);
    expect(createTeamRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Linha 1",
        leaderId: "leader-1",
        memberIds: ["c1"],
        exchangesFirstDay: 1,
        exchangesLastDay: 10,
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:teams", "default");
  });

  it("updateTeam persists via repo", async () => {
    const { updateTeam } = await import("./actions");
    await updateTeam("team-1", { ...form, name: "Linha 2" });
    expect(updateTeamRepo).toHaveBeenCalledWith(
      expect.objectContaining({ id: "team-1", name: "Linha 2" }),
    );
  });

  it("deleteTeam soft-deletes via repo", async () => {
    const { deleteTeam } = await import("./actions");
    await deleteTeam("team-1");
    expect(deleteTeamRepo).toHaveBeenCalledWith("team-1");
  });
});
