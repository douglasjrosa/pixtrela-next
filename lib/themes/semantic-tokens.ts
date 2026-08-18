export const SEMANTIC_TOKEN_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "border",
  "input",
  "ring",
  "overlay",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "star-gold",
  "star-gold-foreground",
  "star-gold-muted",
  "surface-warm",
  "rank-cosmic",
] as const;

export type SemanticTokenKey = (typeof SEMANTIC_TOKEN_KEYS)[number];

export type SemanticTokens = Record<SemanticTokenKey, string>;

export interface SemanticTokenGroup {
  id: string;
  labelKey: string;
  keys: readonly SemanticTokenKey[];
}

export const SEMANTIC_TOKEN_GROUPS: readonly SemanticTokenGroup[] = [
  {
    id: "base",
    labelKey: "semanticTokenGroups.base",
    keys: ["background", "foreground"],
  },
  {
    id: "surfaces",
    labelKey: "semanticTokenGroups.surfaces",
    keys: [
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
      "secondary",
      "secondary-foreground",
    ],
  },
  {
    id: "actions",
    labelKey: "semanticTokenGroups.actions",
    keys: [
      "primary",
      "primary-foreground",
      "destructive",
      "destructive-foreground",
      "success",
      "success-foreground",
      "warning",
      "warning-foreground",
    ],
  },
  {
    id: "borders",
    labelKey: "semanticTokenGroups.borders",
    keys: ["border", "input", "ring", "overlay"],
  },
  {
    id: "charts",
    labelKey: "semanticTokenGroups.charts",
    keys: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
  {
    id: "sidebar",
    labelKey: "semanticTokenGroups.sidebar",
    keys: [
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ],
  },
  {
    id: "colaborator",
    labelKey: "semanticTokenGroups.colaborator",
    keys: [
      "star-gold",
      "star-gold-foreground",
      "star-gold-muted",
      "surface-warm",
      "rank-cosmic",
    ],
  },
] as const;

/** Default theme values — hex equivalents of app/globals.css :root. */
export const DEFAULT_SEMANTIC_TOKENS: SemanticTokens = {
  background: "#ffffff",
  foreground: "#002555",
  card: "#ffffff",
  "card-foreground": "#002555",
  popover: "#ffffff",
  "popover-foreground": "#002555",
  primary: "#4a7fd4",
  "primary-foreground": "#fafafa",
  secondary: "#f7f7f7",
  "secondary-foreground": "#002555",
  muted: "#f7f7f7",
  "muted-foreground": "#737373",
  accent: "#f7f7f7",
  "accent-foreground": "#002555",
  destructive: "#e54d2e",
  "destructive-foreground": "#fafafa",
  success: "#2d8659",
  "success-foreground": "#fafafa",
  warning: "#e8c547",
  "warning-foreground": "#3d3520",
  border: "#ebebeb",
  input: "#ebebeb",
  ring: "#4a7fd4",
  overlay: "#000000",
  "chart-1": "#dedede",
  "chart-2": "#737373",
  "chart-3": "#5c5c5c",
  "chart-4": "#4f4f4f",
  "chart-5": "#3d3d3d",
  sidebar: "#fafafa",
  "sidebar-foreground": "#002555",
  "sidebar-primary": "#4a7fd4",
  "sidebar-primary-foreground": "#fafafa",
  "sidebar-accent": "#f7f7f7",
  "sidebar-accent-foreground": "#002555",
  "sidebar-border": "#ebebeb",
  "sidebar-ring": "#a3a3a3",
  "star-gold": "#d4b84a",
  "star-gold-foreground": "#3d3520",
  "star-gold-muted": "#f5f0e0",
  "surface-warm": "#fcfcf8",
  "rank-cosmic": "#2a2440",
};

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export function isValidSemanticHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value.trim());
}

export function normalizeSemanticHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeSemanticHexColor(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function relativeLuminanceFromHex(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

const DARK_BACKGROUND_LUMINANCE_THRESHOLD = 0.45;

export const SELECT_OPTION_CSS_VAR_KEYS = [
  "select-option-background",
  "select-option-foreground",
  "select-option-highlight-background",
  "select-option-highlight-foreground",
] as const;

export type SelectOptionCssVarKey =
  (typeof SELECT_OPTION_CSS_VAR_KEYS)[number];

export function resolveSelectOptionCssVars(
  tokens: SemanticTokens,
): Record<SelectOptionCssVarKey, string> {
  const isDark = resolveSemanticColorScheme(tokens.background) === "dark";

  if (isDark) {
    const optionBackground =
      relativeLuminanceFromHex(tokens.card) < DARK_BACKGROUND_LUMINANCE_THRESHOLD
        ? tokens.card
        : tokens.background;

    return {
      "select-option-background": optionBackground,
      "select-option-foreground": tokens.foreground,
      "select-option-highlight-background": tokens.primary,
      "select-option-highlight-foreground": tokens["primary-foreground"],
    };
  }

  return {
    "select-option-background": tokens.popover,
    "select-option-foreground": tokens["popover-foreground"],
    "select-option-highlight-background": tokens.accent,
    "select-option-highlight-foreground": tokens["accent-foreground"],
  };
}

export function resolveSemanticColorScheme(
  background: string,
): "light" | "dark" {
  return relativeLuminanceFromHex(background) < DARK_BACKGROUND_LUMINANCE_THRESHOLD
    ? "dark"
    : "light";
}

export function buildSemanticThemeCss(tokens: SemanticTokens): string {
  const colorScheme = resolveSemanticColorScheme(tokens.background);
  const selectOptionVars = resolveSelectOptionCssVars(tokens);
  const lines = [
    ...SEMANTIC_TOKEN_KEYS.map((key) => `  --${key}: ${tokens[key]};`),
    ...SELECT_OPTION_CSS_VAR_KEYS.map(
      (key) => `  --${key}: ${selectOptionVars[key]};`,
    ),
    `  color-scheme: ${colorScheme};`,
  ];

  return `:root {\n${lines.join("\n")}\n}\n\nselect,\nselect option {\n  color-scheme: ${colorScheme};\n}`;
}

export function mergeSemanticTokens(
  partial: Partial<SemanticTokens> | null | undefined,
): SemanticTokens {
  return { ...DEFAULT_SEMANTIC_TOKENS, ...partial };
}

export function semanticTokenLabelKey(key: SemanticTokenKey): string {
  return `semanticTokens.${key.replace(/-/g, "_")}`;
}
