const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

export function resolveStrapiMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${STRAPI_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
