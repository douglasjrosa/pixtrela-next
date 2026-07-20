import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();
const strapiUpload = vi.fn();

vi.mock("@/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { routeThemes: "strapi:route-themes" },
  strapiFetch: (...args: unknown[]) => strapiFetch(...args),
}));
vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags: (...args: unknown[]) => revalidateStrapiTags(...args),
}));
vi.mock("@/lib/strapi/upload", () => ({
  strapiUpload: (...args: unknown[]) => strapiUpload(...args),
}));

describe("updateRouteTheme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { role: "admin" } });
    strapiFetch.mockResolvedValue({});
  });

  it("rejects non-admin", async () => {
    auth.mockResolvedValue({ user: { role: "manager" } });
    const { updateRouteTheme } = await import("./actions");
    await expect(
      updateRouteTheme("doc1", { backgroundColor: "#ffffff" }),
    ).rejects.toThrow("forbidden");
  });

  it("saves color overlay image options and clears image", async () => {
    const { updateRouteTheme } = await import("./actions");
    await updateRouteTheme("doc1", {
      backgroundColor: "#112233",
      backgroundColorOpacity: 0,
      clearBackgroundImage: true,
      backgroundSize: "contain",
      backgroundPosition: "top",
      backgroundRepeat: "repeat-x",
      backgroundMotion: "parallax",
      parallaxIntensity: 50,
      parallaxDirection: "reverse",
      parallaxBleed: 30,
      contentMarginMobile: "sm",
      contentMarginDesktop: "xl",
      foregroundColor: "#002555",
      surfaceColor: "#ffffff",
      surfaceColorOpacity: 80,
    });
    expect(strapiFetch).toHaveBeenCalledWith(
      "/route-themes/doc1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          data: {
            backgroundColor: "#112233",
            backgroundColorOpacity: 0,
            backgroundSize: "contain",
            backgroundPosition: "top",
            backgroundRepeat: "repeat-x",
            backgroundMotion: "parallax",
            parallaxIntensity: 50,
            parallaxDirection: "reverse",
            parallaxBleed: 30,
            contentMarginMobile: "sm",
            contentMarginDesktop: "xl",
            foregroundColor: "#002555",
            surfaceColor: "#ffffff",
            surfaceColorOpacity: 80,
            backgroundImage: null,
          },
        }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:route-themes");
  });
});
