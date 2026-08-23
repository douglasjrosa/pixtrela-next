import {
  DEFAULT_BACKGROUND_COLOR_OPACITY,
  DEFAULT_SURFACE_COLOR,
  DEFAULT_SURFACE_COLOR_OPACITY,
} from "@/lib/themes/match-route-theme";
import type { SemanticTokens } from "@/lib/themes/semantic-tokens";

export interface RouteThemeColorsFromSemantic {
  backgroundColor: string;
  backgroundColorOpacity: number;
  surfaceColor: string;
  surfaceColorOpacity: number;
}

/** Maps semantic palette tokens to per-route background and container colors. */
export function semanticTokensToRouteThemeColors(
  tokens: SemanticTokens,
): RouteThemeColorsFromSemantic {
  return {
    backgroundColor: tokens.background,
    backgroundColorOpacity: DEFAULT_BACKGROUND_COLOR_OPACITY,
    surfaceColor: tokens.card || DEFAULT_SURFACE_COLOR,
    surfaceColorOpacity: DEFAULT_SURFACE_COLOR_OPACITY,
  };
}
