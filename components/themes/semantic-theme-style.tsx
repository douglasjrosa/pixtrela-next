import { loadSemanticThemeCss } from "@/lib/themes/load-semantic-theme";
import { SEMANTIC_THEME_STYLE_ID } from "@/lib/themes/apply-semantic-theme-document";

export async function SemanticThemeStyle() {
  const css = await loadSemanticThemeCss();
  return (
    <style
      id={SEMANTIC_THEME_STYLE_ID}
      precedence="high"
      href="semantic-theme"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
