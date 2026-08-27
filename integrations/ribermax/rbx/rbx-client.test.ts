import { beforeEach, describe, expect, it, vi } from "vitest";

const getRibermaxConnection = vi.fn();

vi.mock("@/integrations/ribermax/settings/connection-repo", () => ({
  getRibermaxConnection: (...args: unknown[]) => getRibermaxConnection(...args),
}));

describe("fetchBoxTemplateData", () => {
  beforeEach(() => {
    getRibermaxConnection.mockReset();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("fails closed when connection settings are missing", async () => {
    getRibermaxConnection.mockResolvedValue(null);
    const { fetchBoxTemplateData } = await import("./rbx-client");
    await expect(fetchBoxTemplateData(12)).rejects.toThrow(
      "ribermaxMisconfigured",
    );
  });

  it("reads credentials from the database and fetches the payload", async () => {
    getRibermaxConnection.mockResolvedValue({
      baseUrl: "https://rbx.example/",
      token: "db-token",
    });
    const payload = {
      prodId: 12,
      empresaNome: "Max",
      boxName: "Caixa",
      subtasks: [{ presetName: "Corte", qty: 1, actionUnits: 10 }],
    };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify(payload),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchBoxTemplateData } = await import("./rbx-client");
    await expect(fetchBoxTemplateData(12)).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://rbx.example/produtos?templateData=12",
      expect.objectContaining({
        headers: expect.objectContaining({ Token: "db-token" }),
      }),
    );
  });
});
