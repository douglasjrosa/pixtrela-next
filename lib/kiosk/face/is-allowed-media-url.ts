import { isTrustedPublicMediaUrl } from "@/lib/media/trusted-public-origin";

/** SSRF guard for proxied face-media upstream URLs. */
export function isAllowedMediaUrl(raw: string): boolean {
  return isTrustedPublicMediaUrl(raw);
}
