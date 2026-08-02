import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const strapiFetch = vi.fn();
const strapiUpload = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { users: "strapi:users" },
  strapiFetch,
}));
vi.mock("@/lib/strapi/revalidate", () => ({ revalidateStrapiTags }));
vi.mock("@/lib/strapi/upload", () => ({ strapiUpload }));

describe("updateUserImage", () => {
  beforeEach(() => {
    auth.mockReset();
    strapiFetch.mockReset();
    strapiUpload.mockReset();
    revalidateStrapiTags.mockReset();
  });

  it("uploads and attaches an avatar to a manageable user", async () => {
    auth.mockResolvedValue({ user: { role: "admin" }, jwt: "token" });
    strapiFetch
      .mockResolvedValueOnce([{ id: 10, roleType: "colaborator" }])
      .mockResolvedValueOnce({});
    strapiUpload.mockResolvedValue(25);
    const formData = new FormData();
    formData.append(
      "file",
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    const { updateUserImage } = await import("./actions");
    await updateUserImage(10, "avatar", formData);

    expect(strapiUpload).toHaveBeenCalledOnce();
    expect(strapiFetch).toHaveBeenLastCalledWith(
      "/users/10",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ avatar: 25 }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:users");
  });

  it("rejects image updates from non-admin users", async () => {
    auth.mockResolvedValue({ user: { role: "manager" }, jwt: "token" });
    const formData = new FormData();
    formData.append(
      "file",
      new File(["face"], "face.png", { type: "image/png" }),
    );

    const { updateUserImage } = await import("./actions");
    await expect(
      updateUserImage(10, "facePhoto", formData),
    ).rejects.toThrow("forbidden");
    expect(strapiUpload).not.toHaveBeenCalled();
  });
});
