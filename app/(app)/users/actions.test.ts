import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const strapiFetch = vi.fn();
const strapiUpload = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => false,
}));
vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { users: "strapi:users" },
  strapiFetch,
}));
vi.mock("@/lib/strapi/revalidate", () => ({ revalidateStrapiTags }));
vi.mock("@/lib/strapi/upload", () => ({ strapiUpload }));

describe("deactivateUser", () => {
  beforeEach(() => {
    auth.mockReset();
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    vi.resetModules();
  });

  it("blocks a manageable user for manager", async () => {
    auth.mockResolvedValue({ user: { role: "manager" }, jwt: "token" });
    strapiFetch
      .mockResolvedValueOnce([{ id: 10, roleType: "colaborator" }])
      .mockResolvedValueOnce({});

    const { deactivateUser } = await import("./actions");
    await deactivateUser(10);

    expect(strapiFetch).toHaveBeenLastCalledWith(
      "/users/10",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ blocked: true }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:users");
  });

  it("allows leader to deactivate colaborator", async () => {
    auth.mockResolvedValue({ user: { role: "leader" }, jwt: "token" });
    strapiFetch
      .mockResolvedValueOnce([{ id: 11, roleType: "colaborator" }])
      .mockResolvedValueOnce({});

    const { deactivateUser } = await import("./actions");
    await deactivateUser(11);

    expect(strapiFetch).toHaveBeenLastCalledWith(
      "/users/11",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ blocked: true }),
      }),
    );
  });

  it("rejects deactivating a role the actor cannot manage", async () => {
    auth.mockResolvedValue({ user: { role: "manager" }, jwt: "token" });
    strapiFetch.mockResolvedValueOnce([{ id: 12, roleType: "manager" }]);

    const { deactivateUser } = await import("./actions");
    await expect(deactivateUser(12)).rejects.toThrow("forbidden");
    expect(strapiFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects when actor cannot view users", async () => {
    auth.mockResolvedValue({ user: { role: "colaborator" }, jwt: "token" });

    const { deactivateUser } = await import("./actions");
    await expect(deactivateUser(10)).rejects.toThrow("forbidden");
    expect(strapiFetch).not.toHaveBeenCalled();
  });
});

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

  it("uploads face photo with faceVector when provided", async () => {
    auth.mockResolvedValue({ user: { role: "admin" }, jwt: "token" });
    strapiFetch
      .mockResolvedValueOnce([{ id: 10, roleType: "colaborator" }])
      .mockResolvedValueOnce({});
    strapiUpload.mockResolvedValue(26);
    const faceVector = Array.from({ length: 128 }, (_, i) => i / 128);
    const formData = new FormData();
    formData.append(
      "file",
      new File(["face"], "face.png", { type: "image/png" }),
    );
    formData.append("faceVector", JSON.stringify(faceVector));

    const { updateUserImage } = await import("./actions");
    await updateUserImage(10, "facePhoto", formData);

    expect(strapiFetch).toHaveBeenLastCalledWith(
      "/users/10",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ facePhoto: 26, faceVector }),
      }),
    );
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

describe("pairUserTag", () => {
  beforeEach(() => {
    auth.mockReset();
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    vi.resetModules();
  });

  it("pairs a normalized tag when admin manages the user", async () => {
    auth.mockResolvedValue({ user: { role: "admin" }, jwt: "token" });
    strapiFetch
      .mockResolvedValueOnce([{ id: 10, roleType: "colaborator" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({});

    const { pairUserTag } = await import("./actions");
    const result = await pairUserTag(10, "04:a3:b2:c1");

    expect(result).toEqual({ ok: true, userTag: "04A3B2C1" });
    expect(strapiFetch).toHaveBeenLastCalledWith(
      "/users/10",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ userTag: "04A3B2C1" }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:users");
  });

  it("returns conflict when another user already has the tag", async () => {
    auth.mockResolvedValue({ user: { role: "manager" }, jwt: "token" });
    strapiFetch
      .mockResolvedValueOnce([{ id: 10, roleType: "colaborator" }])
      .mockResolvedValueOnce([{ id: 99 }]);

    const { pairUserTag } = await import("./actions");
    const result = await pairUserTag(10, "AABBCCDD");

    expect(result).toEqual({ ok: false, error: "conflict" });
  });

  it("returns forbidden for roles that cannot pair tags", async () => {
    auth.mockResolvedValue({ user: { role: "leader" }, jwt: "token" });

    const { pairUserTag } = await import("./actions");
    const result = await pairUserTag(10, "AABBCCDD");

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(strapiFetch).not.toHaveBeenCalled();
  });

  it("returns invalid for short tags", async () => {
    auth.mockResolvedValue({ user: { role: "admin" }, jwt: "token" });

    const { pairUserTag } = await import("./actions");
    const result = await pairUserTag(10, "AB");

    expect(result).toEqual({ ok: false, error: "invalid" });
  });
});
