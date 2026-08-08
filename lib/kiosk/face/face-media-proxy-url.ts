/**
 * Same-origin proxy for Strapi uploads so face-api can read pixels without CORS.
 * Prefer `/api/strapi-media` for new call sites.
 */
import { toBrowserStrapiMediaUrl } from "@/lib/strapi/browser-media-url";

export function toKioskFaceMediaProxyUrl(absoluteUrl: string): string {
  return (
    toBrowserStrapiMediaUrl(absoluteUrl) ??
    `/api/strapi-media?url=${encodeURIComponent(absoluteUrl)}`
  );
}
