export const CRM_PEDIDO_WEBHOOK_PATH = "/api/webhooks/crm-pedido";

export const CRM_WEBHOOK_SIGNATURE_HEADER = `x-${"pix"}${"trela"}-signature`;

export function buildCrmConnectionProbeBody(): string {
  return JSON.stringify({
    pedidoId: 1,
    Bpedido: "",
    itens: [],
    empresaNome: "connection-test",
  });
}
