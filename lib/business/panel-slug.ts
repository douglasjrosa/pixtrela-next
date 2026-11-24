export const PANEL_SLUG_MAX_LENGTH = 64;
export const PANEL_SLUG_FALLBACK = "tv";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPanelSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && value.length <= PANEL_SLUG_MAX_LENGTH;
}

export function slugifyPanelName(name: string): string {
  const ascii = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PANEL_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
  return ascii || PANEL_SLUG_FALLBACK;
}

export function allocateUniquePanelSlug(
  base: string,
  taken: ReadonlySet<string>,
): string {
  const normalized = isPanelSlug(base) ? base : slugifyPanelName(base);
  if (!taken.has(normalized)) return normalized;
  for (let suffix = 2; suffix < Number.MAX_SAFE_INTEGER; suffix += 1) {
    const maxBaseLength = PANEL_SLUG_MAX_LENGTH - String(suffix).length - 1;
    const trimmed = normalized.slice(0, Math.max(1, maxBaseLength));
    const candidate = `${trimmed.replace(/-+$/g, "")}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${PANEL_SLUG_FALLBACK}-${Date.now()}`;
}
