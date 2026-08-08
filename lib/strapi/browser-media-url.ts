/**
 * Builds a same-origin URL for Strapi media so the browser never needs
 * direct access to STRAPI_URL (often private / CORS-blocked).
 */
export function toBrowserStrapiMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl) return null;

  if (
    pathOrUrl.startsWith("/api/strapi-media") ||
    pathOrUrl.startsWith("/api/kiosk/face-media")
  ) {
    return pathOrUrl;
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
    } catch {
      return null;
    }
    return `/api/strapi-media?url=${encodeURIComponent(pathOrUrl)}`;
  }

  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (!normalized.startsWith("/uploads/")) return null;
  return `/api/strapi-media?path=${encodeURIComponent(normalized)}`;
}
