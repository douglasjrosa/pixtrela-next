import { describe, expect, it, vi, beforeEach } from "vitest";

import type { Role } from "@/lib/auth/nav";

const listUsersByRole = vi.fn();

vi.mock("@/lib/repos/users", () => ({
  listUsersByRole: (...args: unknown[]) => listUsersByRole(...args),
}));

describe("loadColaboratorOptions", () => {
  beforeEach(() => {
    listUsersByRole.mockReset();
  });

  it("loads active colaborators from drizzle for staff roles", async () => {
    const { loadColaboratorOptions } = await import(
      "./load-colaborator-options"
    );
    listUsersByRole.mockResolvedValue([
      {
        id: "c1",
        name: "Ana",
        code: 10,
        active: true,
        blocked: false,
      },
      {
        id: "c2",
        name: "Blocked",
        code: 11,
        active: true,
        blocked: true,
      },
    ]);

    const options = await loadColaboratorOptions("manager" as Role);
    expect(listUsersByRole).toHaveBeenCalledWith("colaborator");
    expect(options).toEqual([{ documentId: "c1", name: "Ana", code: 10 }]);
  });
});
