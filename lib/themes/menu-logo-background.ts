import {
  FULLY_TRANSPARENT_OPACITY,
  hexToRgba,
  normalizeOpacity,
} from "@/lib/themes/match-route-theme";

export function resolveMenuLogoBackgroundStyle(
  color: string | null | undefined,
  opacity: number | null | undefined,
): string | undefined {
  const trimmed = color?.trim();
  if (!trimmed) return undefined;
  const normalizedOpacity = normalizeOpacity(opacity);
  if (normalizedOpacity === FULLY_TRANSPARENT_OPACITY) return undefined;
  return hexToRgba(trimmed, normalizedOpacity) ?? undefined;
}
