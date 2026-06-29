import { describe, expect, it } from "vitest";

import { STRAPI_TAGS } from "./tags";

/**
 * Pages tag fetches; actions must invalidate the same tags after mutations.
 * Update this map when adding a new list route or action.
 */
export const LIST_CACHE_MAP: Record<string, readonly string[]> = {
  users: [STRAPI_TAGS.users],
  tasks: [STRAPI_TAGS.tasks, STRAPI_TAGS.steps],
  templates: [STRAPI_TAGS.templateTasks],
  templateSteps: [STRAPI_TAGS.steps],
  taskSubtasks: [STRAPI_TAGS.subTasks, STRAPI_TAGS.tasks],
  teams: [STRAPI_TAGS.teams],
  awards: [STRAPI_TAGS.awards],
  settings: [STRAPI_TAGS.currencies, STRAPI_TAGS.kioskSetting],
  board: [STRAPI_TAGS.tasks, STRAPI_TAGS.steps],
  exchange: [STRAPI_TAGS.exchanges, STRAPI_TAGS.awards, STRAPI_TAGS.balance],
};

describe("LIST_CACHE_MAP", () => {
  it("uses strapi: prefixed tags for all list routes", () => {
    for (const tags of Object.values(LIST_CACHE_MAP)) {
      for (const tag of tags) {
        expect(tag.startsWith("strapi:")).toBe(true);
      }
    }
  });

  it("covers every STRAPI_TAGS list entity", () => {
    const covered = new Set(Object.values(LIST_CACHE_MAP).flat());
    expect(covered.has(STRAPI_TAGS.users)).toBe(true);
    expect(covered.has(STRAPI_TAGS.tasks)).toBe(true);
    expect(covered.has(STRAPI_TAGS.templateTasks)).toBe(true);
  });
});
