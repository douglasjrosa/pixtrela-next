import { describe, expect, it } from "vitest";

import {
  parseLogListSearchParams,
  serializeLogListSearchParams,
} from "@/lib/logs/log-list-params";

describe("log list params", () => {
  it("omits default sort and empty filters", () => {
    const filters = parseLogListSearchParams({});
    expect(filters.direction).toBe("desc");
    expect(filters.q).toBeUndefined();
    expect(serializeLogListSearchParams(filters).toString()).toBe("");
  });

  it("keeps actor, route, dates, text, and ascending sort", () => {
    const filters = parseLogListSearchParams({
      actor: "system",
      route: "/tasks",
      from: "2026-09-01",
      to: "2026-09-23",
      q: "tarefa",
      dir: "asc",
    });
    expect(serializeLogListSearchParams(filters).toString()).toBe(
      "actor=system&route=%2Ftasks&from=2026-09-01&to=2026-09-23&q=tarefa&dir=asc",
    );
  });

  it("drops text shorter than the minimum", () => {
    const filters = parseLogListSearchParams({ q: "a" });
    expect(filters.q).toBeUndefined();
  });
});
