/**
 * Same-origin media URLs for browser <img> / face-api.
 */
import { isTrustedPublicMediaUrl } from "@/lib/media/trusted-public-origin";

export function toBrowserMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl) return null;

  if (pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }

  if (
    pathOrUrl.startsWith("/api/media/") ||
    pathOrUrl.startsWith("/api/kiosk/face-media")
  ) {
    return pathOrUrl;
  }

  if (!pathOrUrl.includes("/") && pathOrUrl.includes(".")) {
    return `/api/media/${encodeURIComponent(pathOrUrl)}`;
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    if (isTrustedPublicMediaUrl(pathOrUrl)) {
      return pathOrUrl;
    }
    try {
      const parsed = new URL(pathOrUrl);
      if (parsed.pathname.startsWith("/api/media/")) {
        return parsed.pathname;
      }
    } catch {
      return null;
    }
    return pathOrUrl;
  }

  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  if (normalized.startsWith("/api/media/")) return normalized;
  return null;
}

/** Resolves stored media reference to a browser-safe URL. */
export function resolveMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  return toBrowserMediaUrl(pathOrUrl);
}
