import { DEFAULT_SEMANTIC_TOKENS } from "./semantic-tokens";

export const SEMANTIC_THEME_PRESET_IDS = [
  "default",
  "ocean",
  "forest",
  "charcoal",
  "violet",
] as const;

export type SemanticThemePresetId = (typeof SEMANTIC_THEME_PRESET_IDS)[number];

export interface SemanticThemePreset {
  id: SemanticThemePresetId;
  labelKey: string;
  tokens: import("./semantic-tokens").SemanticTokens;
}

export const SEMANTIC_THEME_PRESETS: readonly SemanticThemePreset[] = [
  {
    id: "default",
    labelKey: "semanticPresets.default",
    tokens: DEFAULT_SEMANTIC_TOKENS,
  },
  {
    id: "ocean",
    labelKey: "semanticPresets.ocean",
    tokens: {
      ...DEFAULT_SEMANTIC_TOKENS,
      foreground: "#0a2a43",
      "card-foreground": "#0a2a43",
      "popover-foreground": "#0a2a43",
      "secondary-foreground": "#0a2a43",
      "accent-foreground": "#0a2a43",
      primary: "#1e6fbf",
      "primary-foreground": "#f8fbff",
      ring: "#1e6fbf",
      "sidebar-foreground": "#0a2a43",
      "sidebar-primary": "#1e6fbf",
      "sidebar-accent-foreground": "#0a2a43",
      background: "#f4f9ff",
      card: "#ffffff",
      popover: "#ffffff",
      secondary: "#e8f2fb",
      muted: "#e8f2fb",
      accent: "#dceaf7",
      border: "#c5d9ee",
      input: "#c5d9ee",
      success: "#1f7a5c",
      warning: "#d9a441",
      "warning-foreground": "#3d2e10",
    },
  },
  {
    id: "forest",
    labelKey: "semanticPresets.forest",
    tokens: {
      ...DEFAULT_SEMANTIC_TOKENS,
      foreground: "#1f3d2f",
      "card-foreground": "#1f3d2f",
      "popover-foreground": "#1f3d2f",
      "secondary-foreground": "#1f3d2f",
      "accent-foreground": "#1f3d2f",
      primary: "#2f7d57",
      "primary-foreground": "#f5fff9",
      ring: "#2f7d57",
      "sidebar-foreground": "#1f3d2f",
      "sidebar-primary": "#2f7d57",
      "sidebar-accent-foreground": "#1f3d2f",
      background: "#f7fbf8",
      card: "#ffffff",
      popover: "#ffffff",
      secondary: "#e8f3ec",
      muted: "#e8f3ec",
      accent: "#dceee3",
      border: "#c6ddd0",
      input: "#c6ddd0",
      success: "#2f7d57",
      warning: "#c9a227",
      "warning-foreground": "#3d3010",
      "star-gold": "#c9a227",
      "surface-warm": "#f9fbf6",
    },
  },
  {
    id: "charcoal",
    labelKey: "semanticPresets.charcoal",
    tokens: {
      ...DEFAULT_SEMANTIC_TOKENS,
      foreground: "#1f2937",
      "card-foreground": "#1f2937",
      "popover-foreground": "#1f2937",
      "secondary-foreground": "#1f2937",
      "accent-foreground": "#1f2937",
      primary: "#374151",
      "primary-foreground": "#f9fafb",
      ring: "#4b5563",
      "sidebar-foreground": "#1f2937",
      "sidebar-primary": "#374151",
      "sidebar-accent-foreground": "#1f2937",
      background: "#f9fafb",
      card: "#ffffff",
      popover: "#ffffff",
      secondary: "#f3f4f6",
      muted: "#f3f4f6",
      accent: "#e5e7eb",
      border: "#d1d5db",
      input: "#d1d5db",
      destructive: "#dc2626",
      success: "#15803d",
      warning: "#ca8a04",
      "warning-foreground": "#422006",
      "chart-1": "#d1d5db",
      "chart-2": "#9ca3af",
      "chart-3": "#6b7280",
      "chart-4": "#4b5563",
      "chart-5": "#374151",
    },
  },
  {
    id: "violet",
    labelKey: "semanticPresets.violet",
    tokens: {
      ...DEFAULT_SEMANTIC_TOKENS,
      foreground: "#2a1f47",
      "card-foreground": "#2a1f47",
      "popover-foreground": "#2a1f47",
      "secondary-foreground": "#2a1f47",
      "accent-foreground": "#2a1f47",
      primary: "#6d28d9",
      "primary-foreground": "#faf5ff",
      ring: "#6d28d9",
      "sidebar-foreground": "#2a1f47",
      "sidebar-primary": "#6d28d9",
      "sidebar-accent-foreground": "#2a1f47",
      background: "#faf7ff",
      card: "#ffffff",
      popover: "#ffffff",
      secondary: "#f1e9ff",
      muted: "#f1e9ff",
      accent: "#e9ddff",
      border: "#d8c4f5",
      input: "#d8c4f5",
      success: "#2f7d57",
      warning: "#d97706",
      "warning-foreground": "#431407",
      "rank-cosmic": "#3b1f6e",
    },
  },
];

export function getSemanticThemePreset(
  id: SemanticThemePresetId,
): SemanticThemePreset {
  const preset = SEMANTIC_THEME_PRESETS.find((item) => item.id === id);
  if (!preset) throw new Error(`unknown preset: ${id}`);
  return preset;
}
