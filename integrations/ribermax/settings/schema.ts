import { z } from "zod";

export const ribermaxConnectionSchema = z.object({
  baseUrl: z.string().min(1).max(512),
  token: z.string().min(1),
});

export type RibermaxConnectionInput = z.infer<typeof ribermaxConnectionSchema>;
