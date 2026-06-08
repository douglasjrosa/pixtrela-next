import { z } from "zod";

export const kioskIdentifySchema = z.object({
  code: z.coerce.number().int().min(0),
  password: z.string().min(6),
});

export type KioskIdentifyInput = z.infer<typeof kioskIdentifySchema>;
