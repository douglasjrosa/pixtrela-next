/**
 * Same-origin media URLs for browser <img> / face-api.
 * Prefers local `/api/media/...` (Drizzle storage); falls back to Strapi proxy.
 */
import { isTrustedPublicMediaUrl } from "@/lib/media/trusted-public-origin";

function unwrapStrapiMediaProxy(
  pathOrUrl: string,
): string | null {
  if (!pathOrUrl.startsWith("/api/strapi-media")) {
    return null;
  }
  try {
    const params = new URL(pathOrUrl, "http://local.invalid").searchParams;
    return params.get("url");
  } catch {
    return null;
  }
}

export function toBrowserMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl) return null;

  if (pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }

  const embeddedUrl = unwrapStrapiMediaProxy(pathOrUrl);
  if (embeddedUrl) {
    return toBrowserMediaUrl(embeddedUrl);
  }

  if (
    pathOrUrl.startsWith("/api/media/") ||
    pathOrUrl.startsWith("/api/strapi-media") ||
    pathOrUrl.startsWith("/api/kiosk/face-media")
  ) {
    return pathOrUrl;
  }

  // Drizzle local storage keys are served under /api/media/:key
  if (!pathOrUrl.includes("/") && pathOrUrl.includes(".")) {
    return `/api/media/${encodeURIComponent(pathOrUrl)}`;
  }

  if (pathOrUrl.startsWith("/uploads/")) {
    return `/api/strapi-media?path=${encodeURIComponent(pathOrUrl)}`;
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    if (isTrustedPublicMediaUrl(pathOrUrl)) {
      return pathOrUrl;
    }
    try {
      const parsed = new URL(pathOrUrl);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `/api/strapi-media?path=${encodeURIComponent(parsed.pathname)}`;
      }
      if (parsed.pathname.startsWith("/api/media/")) {
        return parsed.pathname;
      }
    } catch {
      return null;
    }
    // CDN / R2 public URLs (not Strapi uploads) — use directly in <img>.
    return pathOrUrl;
  }

  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (normalized.startsWith("/api/media/")) return normalized;
  if (!normalized.startsWith("/uploads/")) return null;
  return `/api/strapi-media?path=${encodeURIComponent(normalized)}`;
}

/** @deprecated Prefer toBrowserMediaUrl */
export const toBrowserStrapiMediaUrl = toBrowserMediaUrl;
