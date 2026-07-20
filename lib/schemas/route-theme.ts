import { z } from "zod";

import {
  BACKGROUND_MOTIONS,
  BACKGROUND_POSITIONS,
  BACKGROUND_REPEATS,
  BACKGROUND_SIZES,
  PAGE_MARGINS,
  PARALLAX_DIRECTIONS,
  ROUTE_THEME_KEYS,
} from "@/lib/themes/match-route-theme";

const HEX_COLOR = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export const routeThemeFormSchema = z.object({
  backgroundColor: z
    .string()
    .trim()
    .refine((value) => value === "" || HEX_COLOR.test(value), {
      message: "invalidHex",
    })
    .optional(),
  backgroundColorOpacity: z.number().int().min(0).max(100).optional(),
  backgroundImageId: z.number().int().positive().nullable().optional(),
  clearBackgroundImage: z.boolean().optional(),
  backgroundSize: z.enum(BACKGROUND_SIZES).optional(),
  backgroundPosition: z.enum(BACKGROUND_POSITIONS).optional(),
  backgroundRepeat: z.enum(BACKGROUND_REPEATS).optional(),
  backgroundMotion: z.enum(BACKGROUND_MOTIONS).optional(),
  parallaxIntensity: z.number().int().min(0).max(100).optional(),
  parallaxDirection: z.enum(PARALLAX_DIRECTIONS).optional(),
  parallaxBleed: z.number().int().min(10).max(40).optional(),
  contentMarginMobile: z.enum(PAGE_MARGINS).optional(),
  contentMarginDesktop: z.enum(PAGE_MARGINS).optional(),
  foregroundColor: z
    .string()
    .trim()
    .refine((value) => value === "" || HEX_COLOR.test(value), {
      message: "invalidHex",
    })
    .optional(),
  surfaceColor: z
    .string()
    .trim()
    .refine((value) => value === "" || HEX_COLOR.test(value), {
      message: "invalidHex",
    })
    .optional(),
  surfaceColorOpacity: z.number().int().min(0).max(100).optional(),
});

export type RouteThemeFormInput = z.infer<typeof routeThemeFormSchema>;

export const routeThemeKeySchema = z.enum(ROUTE_THEME_KEYS);
