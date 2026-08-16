import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createTeamRepo = vi.fn();
const updateTeamRepo = vi.fn();
const deleteTeamRepo = vi.fn();
const findTeamById = vi.fn();
const hardDeleteTeam = vi.fn();

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
  findTeamById: (...args: unknown[]) => findTeamById(...args),
  hardDeleteTeam: (...args: unknown[]) => hardDeleteTeam(...args),
}));

const loadTeamListPageMock = vi.fn();

vi.mock("@/lib/teams/load-team-list-page", () => ({
  loadTeamListPage: (...args: unknown[]) => loadTeamListPageMock(...args),
}));

describe("teams/actions drizzle CRUD", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    createTeamRepo.mockReset();
    updateTeamRepo.mockReset();
    deleteTeamRepo.mockReset();
    findTeamById.mockReset();
    hardDeleteTeam.mockReset();
    loadTeamListPageMock.mockReset();
  });

  const form = {
    name: "Linha 1",
    exchangesFirstDay: 1,
    exchangesLastDay: 10,
    leaderDocumentId: "leader-1",
    colaboratorDocumentIds: ["c1"],
    untill: "",
  };

  it("loadMoreTeams parses filters and loads a page", async () => {
    loadTeamListPageMock.mockResolvedValueOnce({
      teams: [],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });
    const { loadMoreTeams } = await import("./actions");
    await loadMoreTeams({ column: "name", direction: "asc", showArchived: false }, 2);
    expect(loadTeamListPageMock).toHaveBeenCalledWith(
      { q: undefined, column: "name", direction: "asc", showArchived: false },
      2,
    );
  });

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

  it("updateTeam passes until date to repo", async () => {
    const { updateTeam } = await import("./actions");
    await updateTeam("team-1", { ...form, untill: "2026-08-16" });
    expect(updateTeamRepo).toHaveBeenCalledWith(
      expect.objectContaining({ id: "team-1", until: "2026-08-16" }),
    );
  });

  it("deleteTeam archives via repo for manager+", async () => {
    const { deleteTeam } = await import("./actions");
    await deleteTeam("team-1");
    expect(deleteTeamRepo).toHaveBeenCalledWith("team-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:teams", "default");
  });

  it("permanentlyDeleteTeam hard-deletes archived teams only", async () => {
    findTeamById.mockResolvedValue({ id: "team-1", active: false });
    const { permanentlyDeleteTeam } = await import("./actions");
    await permanentlyDeleteTeam("team-1");
    expect(hardDeleteTeam).toHaveBeenCalledWith("team-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:teams", "default");
  });

  it("permanentlyDeleteTeam rejects active teams", async () => {
    findTeamById.mockResolvedValue({ id: "team-1", active: true });
    const { permanentlyDeleteTeam } = await import("./actions");
    await expect(permanentlyDeleteTeam("team-1")).rejects.toThrow("activeTeam");
    expect(hardDeleteTeam).not.toHaveBeenCalled();
  });

  it("bulkArchiveTeams archives each selected team", async () => {
    findTeamById.mockResolvedValue({ id: "team-1", active: true });
    const { bulkArchiveTeams } = await import("./actions");
    await bulkArchiveTeams(["team-1", "team-2"]);
    expect(deleteTeamRepo).toHaveBeenCalledTimes(2);
    expect(deleteTeamRepo).toHaveBeenCalledWith("team-1");
    expect(deleteTeamRepo).toHaveBeenCalledWith("team-2");
  });

  it("bulkDeleteTeams hard-deletes archived teams only", async () => {
    findTeamById.mockResolvedValue({ id: "team-1", active: false });
    const { bulkDeleteTeams } = await import("./actions");
    await bulkDeleteTeams(["team-1", "team-2"]);
    expect(hardDeleteTeam).toHaveBeenCalledTimes(2);
    expect(hardDeleteTeam).toHaveBeenCalledWith("team-1");
    expect(hardDeleteTeam).toHaveBeenCalledWith("team-2");
  });

  it("bulkDeleteTeams rejects active teams", async () => {
    findTeamById.mockResolvedValue({ id: "team-1", active: true });
    const { bulkDeleteTeams } = await import("./actions");
    await expect(bulkDeleteTeams(["team-1"])).rejects.toThrow("activeTeam");
    expect(hardDeleteTeam).not.toHaveBeenCalled();
  });
});
