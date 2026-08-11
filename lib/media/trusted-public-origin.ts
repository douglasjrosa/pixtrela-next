const PUBLIC_BASE_ENV_KEYS = ["S3_PUBLIC_URL", "MEDIA_PUBLIC_BASE_URL"] as const;

/** Origins allowed for direct browser media URLs (R2 custom domain, etc.). */
export function listTrustedMediaPublicOrigins(): string[] {
  const origins = new Set<string>();
  for (const key of PUBLIC_BASE_ENV_KEYS) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      continue;
    }
  }
  return [...origins];
}

export function isTrustedPublicMediaUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return listTrustedMediaPublicOrigins().includes(parsed.origin);
  } catch {
    return false;
  }
}
