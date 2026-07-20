/**
 * Allow only Strapi upload URLs from the configured origin (SSRF guard).
 */
export function isAllowedStrapiMediaUrl(
  raw: string,
  strapiBaseUrl: string,
): boolean {
  try {
    const parsed = new URL(raw);
    const base = new URL(strapiBaseUrl.replace(/\/$/, ""));
    if (parsed.origin !== base.origin) return false;
    return parsed.pathname.startsWith("/uploads/");
  } catch {
    return false;
  }
}
