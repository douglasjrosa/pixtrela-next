import { loadSemanticThemeCss } from "@/lib/themes/load-semantic-theme";

export async function SemanticThemeStyle() {
  const css = await loadSemanticThemeCss();
  return (
    <style
      id="semantic-theme"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
