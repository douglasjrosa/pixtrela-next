import { describe, expect, it } from "vitest";

import { logTextLikePattern } from "@/lib/logs/log-text-search";
import {
  parseLogListSearchParams,
  serializeLogListSearchParams,
} from "@/lib/logs/log-list-params";
import { TRACKED_LOG_ROUTES } from "@/lib/logs/tracked-routes";

const NOW = new Date("2026-09-23T15:00:00Z");

describe("log list params", () => {
  it("defaults the range to today minus 30 through today and omits it", () => {
    const filters = parseLogListSearchParams({}, NOW);
    expect(filters.from).toBe("2026-08-24");
    expect(filters.to).toBe("2026-09-23");
    expect(filters.direction).toBe("desc");
    expect(filters.route).toBeUndefined();
    expect(serializeLogListSearchParams(filters, NOW).toString()).toBe("");
  });

  it("keeps a non-default range, a tracked route, text, and ascending sort", () => {
    const filters = parseLogListSearchParams(
      {
        actor: "system",
        route: "/tasks",
        from: "2026-09-01",
        to: "2026-09-20",
        q: "tarefa",
        dir: "asc",
      },
      NOW,
    );
    expect(serializeLogListSearchParams(filters, NOW).toString()).toBe(
      "actor=system&route=%2Ftasks&from=2026-09-01&to=2026-09-20&q=tarefa&dir=asc",
    );
  });

  it("drops unknown routes and text shorter than the minimum", () => {
    const filters = parseLogListSearchParams({ route: "/unknown", q: "a" }, NOW);
    expect(filters.route).toBeUndefined();
    expect(filters.q).toBeUndefined();
  });

  it("lists the configured tracked routes", () => {
    expect(TRACKED_LOG_ROUTES).toContain("/tasks");
    expect(TRACKED_LOG_ROUTES).toContain("/api/tasks");
  });
});

describe("log text search", () => {
  it("wraps the typed text as a substring pattern", () => {
    expect(logTextLikePattern("texto procurado")).toBe("%texto procurado%");
    expect(logTextLikePattern("%texto%")).toBe("%\\%texto\\%%");
    expect(logTextLikePattern("100%")).toBe("%100\\%%");
  });
});
