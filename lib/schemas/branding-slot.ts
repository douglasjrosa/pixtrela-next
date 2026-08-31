import { z } from "zod";

import {
  BRANDING_SLOT_KEYS,
  BRANDING_SLOT_PROFILES,
  type BrandingSlotConfig,
  type BrandingSlotConfigField,
  type BrandingSlotKey,
  normalizeBrandingSlotConfig,
} from "@/lib/domain/branding-slots";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const brandingSlotConfigBaseSchema = z
  .object({
    backgroundColor: z
      .string()
      .regex(HEX_COLOR)
      .nullable()
      .optional(),
    backgroundColorOpacity: z.number().min(0).max(100).optional(),
    displayOpacity: z.number().min(0).max(100).optional(),
    widthPercent: z.number().min(1).max(100).optional(),
  })
  .strict();

function rejectUnknownConfigFields(
  key: BrandingSlotKey,
  raw: Record<string, unknown>,
  ctx: z.RefinementCtx,
): void {
  const allowed = new Set(BRANDING_SLOT_PROFILES[key].allowedFields);
  for (const field of Object.keys(raw)) {
    if (!allowed.has(field as BrandingSlotConfigField)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field "${field}" is not allowed for slot "${key}"`,
        path: ["config", field],
      });
    }
  }
}

export const brandingSlotKeySchema = z.enum(BRANDING_SLOT_KEYS);

export const brandingSlotUpsertSchema = z
  .object({
    key: brandingSlotKeySchema,
    mediaId: z.string().uuid().nullable().optional(),
    config: brandingSlotConfigBaseSchema.partial().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.config) return;
    rejectUnknownConfigFields(
      value.key,
      value.config as Record<string, unknown>,
      ctx,
    );
    const parsed = normalizeBrandingSlotConfig(value.key, value.config);
    const check = brandingSlotConfigBaseSchema.partial().safeParse(parsed);
    if (!check.success) {
      for (const issue of check.error.issues) {
        ctx.addIssue({ ...issue, path: ["config", ...issue.path] });
      }
    }
  });

export type BrandingSlotUpsertInput = z.infer<typeof brandingSlotUpsertSchema>;

export function parseBrandingSlotConfig(
  key: BrandingSlotKey,
  raw: unknown,
): BrandingSlotConfig {
  return normalizeBrandingSlotConfig(key, raw);
}
