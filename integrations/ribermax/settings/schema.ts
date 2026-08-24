import { z } from "zod";

export const DEFAULT_CUT_SECONDS = 60;
export const DEFAULT_ADHESIVE_SECONDS = 30;
export const DEFAULT_FASTENER_SECONDS = 1;

export const MIN_BOX_TEMPLATE_RATE_SECONDS = 1;
export const MAX_BOX_TEMPLATE_RATE_SECONDS = 3600;

const rateSeconds = z
  .number()
  .int()
  .min(MIN_BOX_TEMPLATE_RATE_SECONDS)
  .max(MAX_BOX_TEMPLATE_RATE_SECONDS);

export const ribermaxBoxTemplateRatesSchema = z.object({
  cutSeconds: rateSeconds,
  adhesiveSeconds: rateSeconds,
  fastenerSeconds: rateSeconds,
});

export type RibermaxBoxTemplateRates = z.infer<
  typeof ribermaxBoxTemplateRatesSchema
>;

export const DEFAULT_BOX_TEMPLATE_RATES: RibermaxBoxTemplateRates = {
  cutSeconds: DEFAULT_CUT_SECONDS,
  adhesiveSeconds: DEFAULT_ADHESIVE_SECONDS,
  fastenerSeconds: DEFAULT_FASTENER_SECONDS,
};
