import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteTasksByCrmPedidoId = vi.fn();

vi.mock("@/lib/repos/tasks", () => ({
  deleteTasksByCrmPedidoId: (...args: unknown[]) =>
    deleteTasksByCrmPedidoId(...args),
}));

import { deleteTasksFromApiByCrmPedidoId } from "./delete-tasks-from-api";

describe("deleteTasksFromApiByCrmPedidoId", () => {
  beforeEach(() => {
    deleteTasksByCrmPedidoId.mockReset();
  });

  it("returns deleted count from repo", async () => {
    deleteTasksByCrmPedidoId.mockResolvedValue(2);
    const result = await deleteTasksFromApiByCrmPedidoId(5264);
    expect(result.deletedCount).toBe(2);
    expect(deleteTasksByCrmPedidoId).toHaveBeenCalledWith(5264);
  });
});
