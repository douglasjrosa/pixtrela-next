import { z } from "zod";

export const crmConnectionSchema = z.object({
  webhookSecret: z.string().min(1),
});

export type CrmConnectionInput = z.infer<typeof crmConnectionSchema>;
