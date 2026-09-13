import { beforeEach, describe, expect, it, vi } from "vitest";

const listSubTaskPresetsRepo = vi.fn();

vi.mock("@/lib/repos/sub-task-presets", () => ({
  listSubTaskPresetsRepo: (...args: unknown[]) => listSubTaskPresetsRepo(...args),
}));

describe("processSubTaskPresetsRequest", () => {
  beforeEach(() => {
    listSubTaskPresetsRepo.mockReset();
    vi.resetModules();
  });

  it("returns 401 when auth fails", async () => {
    const { processSubTaskPresetsRequest } = await import(
      "./handle-sub-task-presets-request"
    );
    const request = new Request("https://app.example/api");
    const result = await processSubTaskPresetsRequest(request, {
      ok: false,
      status: 401,
      error: "unauthorized",
    });
    expect(result).toEqual({
      status: 401,
      body: { error: "unauthorized" },
    });
    expect(listSubTaskPresetsRepo).not.toHaveBeenCalled();
  });

  it("returns active presets for authorized RBX requests", async () => {
    listSubTaskPresetsRepo.mockResolvedValue([
      {
        documentId: "11111111-1111-4111-8111-111111111111",
        name: "Montagem dos pés",
        sharingType: "qty",
        maxSameTimeWorkers: 2,
        actionId: "a1",
        actionName: "Pregar toco no pé do palete",
        actionUnitTime: 22,
        actionQtyQuestion: "Q?",
        subTaskCategoryId: null,
        active: true,
      },
    ]);

    const { processSubTaskPresetsRequest } = await import(
      "./handle-sub-task-presets-request"
    );
    const request = new Request("https://app.example/api");
    const result = await processSubTaskPresetsRequest(request, { ok: true });

    expect(result).toEqual({
      status: 200,
      body: {
        presets: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Montagem dos pés",
            sharingType: "qty",
            actionName: "Pregar toco no pé do palete",
            actionUnitTime: 22,
            maxSameTimeWorkers: 2,
          },
        ],
      },
    });
  });
});
