import {
  FULLY_TRANSPARENT_OPACITY,
  hexToRgba,
  normalizeOpacity,
} from "@/lib/themes/match-route-theme";

export const BRANDING_SLOT_KEYS = [
  "menu_logo",
  "cart_watermark",
  "ranking_first",
  "ranking_second",
  "ranking_third",
] as const;

export type BrandingSlotKey = (typeof BRANDING_SLOT_KEYS)[number];

export type BrandingSlotConfigField =
  | "backgroundColor"
  | "backgroundColorOpacity"
  | "displayOpacity"
  | "widthPercent";

export type BrandingSlotProfile = {
  allowedFields: ReadonlyArray<BrandingSlotConfigField>;
};

export const BRANDING_SLOT_PROFILES: Record<BrandingSlotKey, BrandingSlotProfile> =
  {
    menu_logo: {
      allowedFields: ["backgroundColor", "backgroundColorOpacity"],
    },
    cart_watermark: {
      allowedFields: [
        "backgroundColor",
        "backgroundColorOpacity",
        "displayOpacity",
        "widthPercent",
      ],
    },
    ranking_first: { allowedFields: [] },
    ranking_second: { allowedFields: [] },
    ranking_third: { allowedFields: [] },
  };

export type BrandingSlotConfig = {
  backgroundColor?: string | null;
  backgroundColorOpacity?: number;
  displayOpacity?: number;
  widthPercent?: number;
};

export const DEFAULT_CART_WATERMARK_DISPLAY_OPACITY = 70;
export const DEFAULT_CART_WATERMARK_WIDTH_PERCENT = 50;

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isBrandingSlotKey(value: string): value is BrandingSlotKey {
  return (BRANDING_SLOT_KEYS as readonly string[]).includes(value);
}

export function defaultBrandingSlotConfig(key: BrandingSlotKey): BrandingSlotConfig {
  if (key === "cart_watermark") {
    return {
      displayOpacity: DEFAULT_CART_WATERMARK_DISPLAY_OPACITY,
      widthPercent: DEFAULT_CART_WATERMARK_WIDTH_PERCENT,
    };
  }
  return {};
}

export function normalizeBrandingSlotConfig(
  key: BrandingSlotKey,
  raw: unknown,
): BrandingSlotConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaultBrandingSlotConfig(key);
  }

  const input = raw as Record<string, unknown>;
  const allowed = new Set(BRANDING_SLOT_PROFILES[key].allowedFields);
  const config: BrandingSlotConfig = { ...defaultBrandingSlotConfig(key) };

  if (allowed.has("backgroundColor")) {
    const color = input.backgroundColor;
    if (color === null) {
      config.backgroundColor = null;
    } else if (typeof color === "string" && HEX_COLOR_PATTERN.test(color.trim())) {
      config.backgroundColor = color.trim();
    }
  }

  if (allowed.has("backgroundColorOpacity")) {
    const opacity = input.backgroundColorOpacity;
    if (typeof opacity === "number" && Number.isFinite(opacity)) {
      config.backgroundColorOpacity = normalizeOpacity(opacity);
    }
  }

  if (allowed.has("displayOpacity")) {
    const opacity = input.displayOpacity;
    if (typeof opacity === "number" && Number.isFinite(opacity)) {
      config.displayOpacity = normalizeOpacity(opacity);
    }
  }

  if (allowed.has("widthPercent")) {
    const width = input.widthPercent;
    if (typeof width === "number" && Number.isFinite(width)) {
      config.widthPercent = Math.min(100, Math.max(1, Math.round(width)));
    }
  }

  return config;
}

export function resolveBrandingBackgroundStyle(
  config: BrandingSlotConfig,
): string | undefined {
  const trimmed = config.backgroundColor?.trim();
  if (!trimmed) return undefined;
  const normalizedOpacity = normalizeOpacity(config.backgroundColorOpacity);
  if (normalizedOpacity === FULLY_TRANSPARENT_OPACITY) return undefined;
  return hexToRgba(trimmed, normalizedOpacity) ?? undefined;
}

export type CartWatermarkDisplayStyle = {
  opacity: number;
  widthPercent: number;
};

export function resolveCartWatermarkStyle(
  config: BrandingSlotConfig,
): CartWatermarkDisplayStyle {
  return {
    opacity:
      config.displayOpacity ?? DEFAULT_CART_WATERMARK_DISPLAY_OPACITY,
    widthPercent:
      config.widthPercent ?? DEFAULT_CART_WATERMARK_WIDTH_PERCENT,
  };
}
