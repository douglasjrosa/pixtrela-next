import { describe, expect, it, beforeEach } from "vitest";

import { SEMANTIC_THEME_STYLE_ID } from "@/lib/themes/apply-semantic-theme-document";
import { getSemanticThemePreset } from "@/lib/themes/semantic-theme-presets";
import { DEFAULT_SEMANTIC_TOKENS } from "@/lib/themes/semantic-tokens";

import {
  ROUTE_THEME_BACKGROUND_ATTR,
  ROUTE_THEME_SURFACE_ATTR,
  applySemanticThemePreview,
  clearSemanticThemePreview,
} from "./semantic-theme-preview";

describe("semantic-theme-preview", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
    document.getElementById(SEMANTIC_THEME_STYLE_ID)?.remove();
    document.body.innerHTML = "";
  });

  it("applies semantic and route surface/background colors", () => {
    const style = document.createElement("style");
    style.id = SEMANTIC_THEME_STYLE_ID;
    document.head.appendChild(style);

    const surface = document.createElement("div");
    surface.setAttribute(ROUTE_THEME_SURFACE_ATTR, "");
    surface.setAttribute("style", "background-color: rgba(255, 255, 255, 0.5);");
    const background = document.createElement("div");
    background.setAttribute(ROUTE_THEME_BACKGROUND_ATTR, "");
    background.setAttribute("style", "background-color: #f4f1ea;");
    document.body.append(surface, background);

    const neon = getSemanticThemePreset("neon").tokens;
    applySemanticThemePreview(neon);

    expect(style.textContent).toContain("--primary: #d946ef;");
    expect(surface.style.backgroundColor).toBe("rgb(22, 11, 36)");
    expect(background.style.backgroundColor).toBe("rgb(12, 6, 20)");
  });

  it("restores the saved baseline when cleared", () => {
    const style = document.createElement("style");
    style.id = SEMANTIC_THEME_STYLE_ID;
    document.head.appendChild(style);

    const surface = document.createElement("div");
    surface.setAttribute(ROUTE_THEME_SURFACE_ATTR, "");
    surface.setAttribute("style", "background-color: #ffffff;");
    document.body.append(surface);

    applySemanticThemePreview(getSemanticThemePreset("ocean").tokens);
    clearSemanticThemePreview(DEFAULT_SEMANTIC_TOKENS);

    expect(style.textContent).toContain(
      `--primary: ${DEFAULT_SEMANTIC_TOKENS.primary};`,
    );
    expect(surface.style.backgroundColor).toBe("rgb(255, 255, 255)");
  });
});
