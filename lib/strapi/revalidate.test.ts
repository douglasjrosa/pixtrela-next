import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTag = vi.fn();
const refresh = vi.fn();

vi.mock("next/cache", () => ({
  updateTag,
  refresh,
}));

describe("revalidateStrapiTags", () => {
  beforeEach(() => {
    updateTag.mockClear();
    refresh.mockClear();
  });

  it("calls updateTag for each tag (read-your-own-writes)", async () => {
    const { revalidateStrapiTags } = await import("./revalidate");
    revalidateStrapiTags("strapi:users", "strapi:teams");
    expect(updateTag).toHaveBeenCalledWith("strapi:users");
    expect(updateTag).toHaveBeenCalledWith("strapi:teams");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("deduplicates tags and skips refresh when empty", async () => {
    const { revalidateStrapiTags } = await import("./revalidate");
    revalidateStrapiTags("strapi:users", "strapi:users");
    expect(updateTag).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("does nothing when no tags passed", async () => {
    const { revalidateStrapiTags } = await import("./revalidate");
    revalidateStrapiTags();
    expect(updateTag).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
