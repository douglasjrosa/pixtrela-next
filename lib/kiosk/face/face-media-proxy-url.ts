/**
 * Rewrites an absolute Strapi upload URL to a same-origin proxy for face-api.
 */
export function toKioskFaceMediaProxyUrl(absoluteUrl: string): string {
  return `/api/kiosk/face-media?url=${encodeURIComponent(absoluteUrl)}`;
}
