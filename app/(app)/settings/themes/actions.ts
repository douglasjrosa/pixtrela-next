"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  routeThemeFormSchema,
  type RouteThemeFormInput,
} from "@/lib/schemas/route-theme";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";
import { strapiUpload } from "@/lib/strapi/upload";
import {
  DEFAULT_BACKGROUND_COLOR_OPACITY,
  DEFAULT_BACKGROUND_MOTION,
  DEFAULT_BACKGROUND_POSITION,
  DEFAULT_BACKGROUND_REPEAT,
  DEFAULT_BACKGROUND_SIZE,
  DEFAULT_PAGE_MARGIN_DESKTOP,
  DEFAULT_PAGE_MARGIN_MOBILE,
  DEFAULT_PARALLAX_BLEED,
  DEFAULT_PARALLAX_DIRECTION,
  DEFAULT_PARALLAX_INTENSITY,
  DEFAULT_FOREGROUND_COLOR,
  DEFAULT_SURFACE_COLOR,
  DEFAULT_SURFACE_COLOR_OPACITY,
  normalizeForegroundColor,
  normalizeOpacity,
  normalizeParallaxBleed,
  normalizeParallaxIntensity,
  normalizeSurfaceColor,
} from "@/lib/themes/match-route-theme";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateThemes(): void {
  revalidateStrapiTags(STRAPI_TAGS.routeThemes);
}

export async function uploadRouteThemeImage(formData: FormData): Promise<number> {
  await assertCanManage();
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "image/jpeg";
  const file =
    entry instanceof File
      ? entry
      : new File([entry], "route-theme.jpg", { type: mimeType });
  return strapiUpload(file);
}

export async function updateRouteTheme(
  documentId: string,
  raw: RouteThemeFormInput,
): Promise<void> {
  await assertCanManage();
  const data = routeThemeFormSchema.parse(raw);
  const payload: Record<string, unknown> = {
    backgroundColor: data.backgroundColor?.trim()
      ? data.backgroundColor.trim()
      : null,
    backgroundColorOpacity: normalizeOpacity(
      data.backgroundColorOpacity ?? DEFAULT_BACKGROUND_COLOR_OPACITY,
    ),
    backgroundSize: data.backgroundSize ?? DEFAULT_BACKGROUND_SIZE,
    backgroundPosition: data.backgroundPosition ?? DEFAULT_BACKGROUND_POSITION,
    backgroundRepeat: data.backgroundRepeat ?? DEFAULT_BACKGROUND_REPEAT,
    backgroundMotion: data.backgroundMotion ?? DEFAULT_BACKGROUND_MOTION,
    parallaxIntensity: normalizeParallaxIntensity(
      data.parallaxIntensity ?? DEFAULT_PARALLAX_INTENSITY,
    ),
    parallaxDirection: data.parallaxDirection ?? DEFAULT_PARALLAX_DIRECTION,
    parallaxBleed: normalizeParallaxBleed(
      data.parallaxBleed ?? DEFAULT_PARALLAX_BLEED,
    ),
    contentMarginMobile: data.contentMarginMobile ?? DEFAULT_PAGE_MARGIN_MOBILE,
    contentMarginDesktop:
      data.contentMarginDesktop ?? DEFAULT_PAGE_MARGIN_DESKTOP,
    foregroundColor: normalizeForegroundColor(
      data.foregroundColor?.trim()
        ? data.foregroundColor.trim()
        : DEFAULT_FOREGROUND_COLOR,
    ),
    surfaceColor: normalizeSurfaceColor(
      data.surfaceColor?.trim()
        ? data.surfaceColor.trim()
        : DEFAULT_SURFACE_COLOR,
    ),
    surfaceColorOpacity: normalizeOpacity(
      data.surfaceColorOpacity ?? DEFAULT_SURFACE_COLOR_OPACITY,
    ),
  };
  if (data.clearBackgroundImage) {
    payload.backgroundImage = null;
  } else if (data.backgroundImageId) {
    payload.backgroundImage = data.backgroundImageId;
  }

  await strapiFetch(`/route-themes/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: payload }),
  });
  invalidateThemes();
}
