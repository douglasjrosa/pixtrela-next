/**
 * Same-origin URLs for face-api / <img crossOrigin="anonymous">.
 * R2 public URLs are not CORS-enabled; proxy via `/api/strapi-media`.
 */
import { toBrowserMediaUrl } from "@/lib/strapi/browser-media-url";

export function toKioskFaceMediaProxyUrl(
  absoluteUrl: string | null | undefined,
): string | null {
  const browser = toBrowserMediaUrl(absoluteUrl);
  if (!browser) return null;
  if (browser.startsWith("/api/") || browser.startsWith("blob:")) {
    return browser;
  }
  if (browser.startsWith("http://") || browser.startsWith("https://")) {
    return `/api/strapi-media?url=${encodeURIComponent(browser)}`;
  }
  return browser;
}
