const DEFAULT_STRAPI_URL = "http://127.0.0.1:1337";

const LOCAL_STRAPI_HOSTS = new Set(["127.0.0.1", "localhost"]);

function getStrapiUrl(): string {
  return process.env.STRAPI_URL ?? DEFAULT_STRAPI_URL;
}

function normalizeStrapiPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function rewriteLocalStrapiUrl(url: URL): string {
  const pathname = `${url.pathname}${url.search}${url.hash}`;
  return `${getStrapiUrl().replace(/\/$/, "")}${pathname}`;
}

export function resolveStrapiMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const parsed = new URL(path);
      if (LOCAL_STRAPI_HOSTS.has(parsed.hostname)) {
        return rewriteLocalStrapiUrl(parsed);
      }
    } catch {
      return path;
    }
    return path;
  }

  return `${getStrapiUrl().replace(/\/$/, "")}${normalizeStrapiPath(path)}`;
}
