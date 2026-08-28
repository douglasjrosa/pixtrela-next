import { z } from "zod";

export const crmConnectionSchema = z.object({
  baseUrl: z.string().url(),
  webhookSecret: z.string().min(1),
});

export type CrmConnectionInput = z.infer<typeof crmConnectionSchema>;

export type CrmConnection = {
  baseUrl: string;
  webhookSecret: string;
};
