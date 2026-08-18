function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function readEnvUrl(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? trimTrailingSlash(value) : null;
}

/**
 * Canonical public origin for links in outbound email (password reset, etc.).
 * Prefer explicit NEXT_PUBLIC_APP_URL, then Auth.js AUTH_URL (set on Vercel prod).
 */
export function getAppBaseUrl(): string {
  const fromPublic = readEnvUrl("NEXT_PUBLIC_APP_URL");
  if (fromPublic) return fromPublic;

  const fromAuth = readEnvUrl("AUTH_URL");
  if (fromAuth) return fromAuth;

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return trimTrailingSlash(`https://${vercelHost}`);
  }

  return "http://localhost:3000"; // pragma: allowlist secret
}
