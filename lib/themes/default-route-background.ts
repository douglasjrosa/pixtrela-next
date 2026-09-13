import {
  DEFAULT_SEMANTIC_TOKENS,
  normalizeSemanticHexColor,
  type SemanticTokenKey,
  type SemanticTokens,
} from "@/lib/themes/semantic-tokens";

/** Bundled SVG used as the app default route background (not media library). */
export const DEFAULT_ROUTE_BACKGROUND_IMAGE_PATH = "/images/star-sheet.svg";

/** Semantic token for the default SVG fill when no custom color is stored. */
export const DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR_KEY: SemanticTokenKey =
  "muted-foreground";

/** Fallback hex for Texto suave when semantic tokens are unavailable. */
export const DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR =
  DEFAULT_SEMANTIC_TOKENS[DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR_KEY];

export function resolveDefaultIllustrationColor(
  tokens: SemanticTokens,
): string {
  return (
    normalizeSemanticHexColor(tokens[DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR_KEY]) ??
    DEFAULT_ROUTE_BACKGROUND_IMAGE_COLOR
  );
}

export function isDefaultRouteBackgroundImage(
  url: string | null | undefined,
): boolean {
  if (!url) return false;
  const path = url.split("?")[0]?.split("#")[0] ?? url;
  return path === DEFAULT_ROUTE_BACKGROUND_IMAGE_PATH;
}

export function resolveRouteThemeBackgroundImage(input: {
  useDefaultBackgroundImage: boolean;
  mediaUrl: string | null;
}): { url: string | null; usesDefault: boolean } {
  if (input.useDefaultBackgroundImage) {
    return {
      url: DEFAULT_ROUTE_BACKGROUND_IMAGE_PATH,
      usesDefault: true,
    };
  }
  return { url: input.mediaUrl, usesDefault: false };
}
