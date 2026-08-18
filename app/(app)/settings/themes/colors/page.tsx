import { DefaultColorsSection } from "@/components/settings/default-colors-section";
import { loadSemanticThemeForSettings } from "@/lib/themes/load-semantic-theme";

import { updateSemanticTheme } from "../actions";

export default async function SettingsThemeColorsPage() {
  const semanticTokens = await loadSemanticThemeForSettings();

  async function handleSaveSemanticTokens(
    values: Parameters<typeof updateSemanticTheme>[0],
  ): Promise<void> {
    "use server";
    await updateSemanticTheme(values);
  }

  return (
    <DefaultColorsSection
      initialTokens={semanticTokens}
      onSave={handleSaveSemanticTokens}
    />
  );
}
