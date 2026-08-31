import { resolveBrandingBackgroundStyle } from "@/lib/domain/branding-slots";
import type { BrandingSlotConfig } from "@/lib/domain/branding-slots";

export function resolveMenuLogoBackgroundStyle(
  color: string | null | undefined,
  opacity: number | null | undefined,
): string | undefined {
  return resolveBrandingBackgroundStyle({
    backgroundColor: color ?? undefined,
    backgroundColorOpacity: opacity ?? undefined,
  });
}

export { resolveBrandingBackgroundStyle };

export type { BrandingSlotConfig };
