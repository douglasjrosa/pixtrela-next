import { applySemanticThemeToDocument } from "@/lib/themes/apply-semantic-theme-document";
import { semanticTokensToRouteThemeColors } from "@/lib/themes/semantic-route-theme-colors";
import type { SemanticTokens } from "@/lib/themes/semantic-tokens";

export const ROUTE_THEME_SURFACE_ATTR = "data-route-theme-surface";
export const ROUTE_THEME_BACKGROUND_ATTR = "data-route-theme-background";

const PREVIEW_SURFACE_STYLE_ATTR = "data-semantic-preview-surface-style";
const PREVIEW_BACKGROUND_STYLE_ATTR = "data-semantic-preview-background-style";

function storeInlineStyle(
  element: HTMLElement,
  backupAttr: string,
): void {
  if (!element.hasAttribute(backupAttr)) {
    element.setAttribute(backupAttr, element.getAttribute("style") ?? "");
  }
}

function restoreInlineStyle(element: HTMLElement, backupAttr: string): void {
  if (!element.hasAttribute(backupAttr)) return;
  const previous = element.getAttribute(backupAttr) ?? "";
  if (previous) {
    element.setAttribute("style", previous);
  } else {
    element.removeAttribute("style");
  }
  element.removeAttribute(backupAttr);
}

/** Live preview for the semantic colors settings page (revert on leave). */
export function applySemanticThemePreview(tokens: SemanticTokens): void {
  applySemanticThemeToDocument(tokens);

  const routeColors = semanticTokensToRouteThemeColors(tokens);
  const surface = document.querySelector<HTMLElement>(
    `[${ROUTE_THEME_SURFACE_ATTR}]`,
  );
  if (surface) {
    storeInlineStyle(surface, PREVIEW_SURFACE_STYLE_ATTR);
    surface.style.backgroundColor = routeColors.surfaceColor;
  }

  const background = document.querySelector<HTMLElement>(
    `[${ROUTE_THEME_BACKGROUND_ATTR}]`,
  );
  if (background) {
    storeInlineStyle(background, PREVIEW_BACKGROUND_STYLE_ATTR);
    background.style.backgroundColor = routeColors.backgroundColor;
  }
}

export function clearSemanticThemePreview(baseline: SemanticTokens): void {
  applySemanticThemeToDocument(baseline);

  const surface = document.querySelector<HTMLElement>(
    `[${ROUTE_THEME_SURFACE_ATTR}]`,
  );
  if (surface) {
    restoreInlineStyle(surface, PREVIEW_SURFACE_STYLE_ATTR);
  }

  const background = document.querySelector<HTMLElement>(
    `[${ROUTE_THEME_BACKGROUND_ATTR}]`,
  );
  if (background) {
    restoreInlineStyle(background, PREVIEW_BACKGROUND_STYLE_ATTR);
  }
}
