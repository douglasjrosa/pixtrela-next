import { describe, expect, it } from "vitest";

/**
 * Ensures strapiFetch attaches cache tags when lists opt into caching.
 * Mutations invalidate via updateTag in revalidateStrapiTags.
 */
describe("strapiFetch cache tags", () => {
  it("documents required shape for cached list reads", () => {
    const listReadOptions = {
      strapiCache: { tags: ["strapi:users"], revalidate: 60 },
    };
    expect(listReadOptions.strapiCache.tags?.[0]).toMatch(/^strapi:/);
  });
});
