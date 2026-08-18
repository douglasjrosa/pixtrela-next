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
  /** Ink on solid `--star-gold` fills (buttons), not muted/card surfaces. */
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

export function mergeSemanticTokens(
  partial: Partial<SemanticTokens> | null | undefined,
): SemanticTokens {
  return { ...DEFAULT_SEMANTIC_TOKENS, ...partial };
}

export function buildSemanticThemeCss(tokens: SemanticTokens): string {
  const lines = SEMANTIC_TOKEN_KEYS.map(
    (key) => `  --${key}: ${tokens[key]};`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

export function semanticTokenLabelKey(key: SemanticTokenKey): string {
  return `semanticTokens.${key.replace(/-/g, "_")}`;
}
