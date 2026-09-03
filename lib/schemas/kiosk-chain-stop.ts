import { z } from "zod";

import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";

export const chainStopAnswerSchema = z.object({
  documentId: z.string().min(1),
  completed: z.boolean().optional(),
  qty: z.number().int().min(0).optional(),
  flagIds: z.array(z.string().min(1)).optional(),
  semBandeira: z.boolean().optional(),
  availableFlagCount: z.number().int().min(0).optional(),
});

export const chainStopAnswersSchema = z.array(chainStopAnswerSchema).min(1);

export function parseChainStopAnswers(raw: unknown): ChainStopAnswer[] {
  return chainStopAnswersSchema.parse(raw);
}
