import { z } from "zod";

const MIN_UNIT_TIME = 0.01;
const MAX_UNIT_TIME = 86_400;

export const factoryActionFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  unitTime: z.number().min(MIN_UNIT_TIME).max(MAX_UNIT_TIME),
  qtyQuestion: z.string().min(1),
});

export type FactoryActionFormInput = z.infer<typeof factoryActionFormSchema>;
