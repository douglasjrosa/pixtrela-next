import { z } from "zod";

import type { BoxTemplateData } from "@/integrations/ribermax/rbx/rbx-types";

const legacyNumberSchema = z.union([z.number(), z.string(), z.null()]);

export const boxTemplateSubtaskSchema = z.object({
  presetId: z.string().trim().min(1).optional(),
  presetName: z.string().trim().min(1),
  qty: legacyNumberSchema.nullish(),
  actionUnits: legacyNumberSchema.nullish(),
});

export const boxTemplateDataSchema = z.object({
  prodId: z.coerce.number().int().positive(),
  empresaNome: z.string(),
  boxName: z.string(),
  subtasks: z.array(boxTemplateSubtaskSchema),
});

export const apiTaskUpsertSchema = z.object({
  name: z.string().trim().min(1),
  qty: z.coerce.number().int().min(1),
  deliveryDate: z.string().trim().min(1).nullable().optional(),
  externalKey: z.string().trim().min(1),
  templateTaskCode: z.string().trim().min(1),
  versions: z.array(z.union([z.string(), z.number()])).optional().default([]),
  template: boxTemplateDataSchema.optional().nullable(),
});

export const apiTaskPatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  qty: z.coerce.number().int().min(1).optional(),
  deliveryDate: z.string().trim().min(1).nullable().optional(),
});

export type ApiTaskUpsertInput = z.infer<typeof apiTaskUpsertSchema>;
export type ApiTaskPatchInput = z.infer<typeof apiTaskPatchSchema>;

/** Maps validated API JSON to the Ribermax box template contract. */
export function toBoxTemplateData(
  template: ApiTaskUpsertInput["template"],
): BoxTemplateData | null {
  if (!template) return null;
  return {
    prodId: template.prodId,
    empresaNome: template.empresaNome,
    boxName: template.boxName,
    subtasks: template.subtasks.map((row) => ({
      presetName: row.presetName,
      presetId: row.presetId,
      qty: row.qty,
      actionUnits: row.actionUnits,
    })),
  };
}

/** Extracts numeric pedido id from externalKey prefix when `pedidoId:index`. */
export function crmPedidoIdFromExternalKey(externalKey: string): number | null {
  const prefix = externalKey.split(":")[0]?.trim() ?? "";
  if (!/^\d+$/.test(prefix)) return null;
  const value = Number(prefix);
  return Number.isFinite(value) ? value : null;
}
