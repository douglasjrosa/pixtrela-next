import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  updateTag,
  revalidatePath,
}));

describe("revalidateStrapiTags", () => {
  beforeEach(() => {
    updateTag.mockClear();
    revalidatePath.mockClear();
  });

  it("calls updateTag for each tag", async () => {
    const { revalidateStrapiTags } = await import("./revalidate");
    revalidateStrapiTags("strapi:users", "strapi:teams");
    expect(updateTag).toHaveBeenCalledWith("strapi:users");
    expect(updateTag).toHaveBeenCalledWith("strapi:teams");
  });

  it("revalidates paths when options are provided", async () => {
    const { revalidateStrapiTags } = await import("./revalidate");
    revalidateStrapiTags("strapi:tasks", {
      paths: ["/tasks", "/tasks/t1"],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/tasks");
    expect(revalidatePath).toHaveBeenCalledWith("/tasks/t1");
  });

  it("deduplicates tags", async () => {
    const { revalidateStrapiTags } = await import("./revalidate");
    revalidateStrapiTags("strapi:users", "strapi:users");
    expect(updateTag).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no tags passed", async () => {
    const { revalidateStrapiTags } = await import("./revalidate");
    revalidateStrapiTags();
    expect(updateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
