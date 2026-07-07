import { z } from "zod";

export const crmPedidoWebhookSchema = z.object({
  pedidoId: z.number().int().positive(),
  Bpedido: z.string(),
  itens: z.unknown(),
  dataEntrega: z.string().nullable().optional(),
  empresaNome: z.string().min(1),
});

export type CrmPedidoWebhookInput = z.infer<typeof crmPedidoWebhookSchema>;
