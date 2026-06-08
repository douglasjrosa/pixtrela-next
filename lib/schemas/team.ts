import { z } from "zod";

export const DEFAULT_EXCHANGES_FIRST_DAY = 3;
export const DEFAULT_EXCHANGES_LAST_DAY = 15;

export const teamFormSchema = z.object({
  name: z.string().min(1),
  exchangesFirstDay: z.number().int().min(1).max(31),
  exchangesLastDay: z.number().int().min(1).max(31),
  leaderDocumentId: z.string().optional(),
  colaboratorDocumentIds: z.array(z.string()).optional(),
  untill: z.string().optional(),
});

export type TeamFormInput = z.infer<typeof teamFormSchema>;
