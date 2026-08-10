/**
 * Same-origin media URLs for browser <img> / face-api.
 * Prefers local `/api/media/...` (Drizzle storage); falls back to Strapi proxy.
 */
export function toBrowserMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl) return null;

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
    return `/api/strapi-media?url=${encodeURIComponent(pathOrUrl)}`;
  }

  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (normalized.startsWith("/api/media/")) return normalized;
  if (!normalized.startsWith("/uploads/")) return null;
  return `/api/strapi-media?path=${encodeURIComponent(normalized)}`;
}

/** @deprecated Prefer toBrowserMediaUrl */
export const toBrowserStrapiMediaUrl = toBrowserMediaUrl;
