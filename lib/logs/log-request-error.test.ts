import { beforeEach, describe, expect, it, vi } from "vitest";

const auditBug = vi.fn();

vi.mock("@/lib/logs/record-log", () => ({
  auditBug: (...args: unknown[]) => auditBug(...args),
}));

import { logRequestError } from "./log-request-error";

const REQUEST = { path: "/tasks", method: "GET" };
const CONTEXT = { routePath: "/tasks", routeType: "render" };

describe("logRequestError", () => {
  beforeEach(() => {
    auditBug.mockReset();
  });

  it("skips validation-style errors", async () => {
    await logRequestError(new Error("notFound"), REQUEST, CONTEXT);
    expect(auditBug).not.toHaveBeenCalled();
  });

  it("records an unexpected failure on the request route", async () => {
    await logRequestError(
      new Error("database connection lost"),
      REQUEST,
      { routePath: "", routeType: "" },
    );
    expect(auditBug).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/tasks",
        operation: "GET",
      }),
    );
  });
});
