import { parsePedidoItens, type CrmPedidoItem } from "./parse-pedido-itens";

export interface CrmPedidoEntity {
  id: number;
  itens: unknown;
  dataEntrega?: string | null;
  empresaNome: string;
}

export interface CrmTaskDraft {
  crmPedidoId: number;
  crmItemKey: string;
  name: string;
  qty: number;
  deliveryDate: string | null;
  templateTaskCode: string;
  prodId: number;
}

export function buildCrmItemKey(pedidoId: number, itemIndex: number): string {
  return `${pedidoId}:${itemIndex}`;
}

export function buildTaskNameFromPedidoItem(
  item: CrmPedidoItem,
  empresaNome: string,
): string {
  return `${item.qty} - ${empresaNome} - ${item.nomeProd}`;
}

export function mapPedidoToTaskDrafts(pedido: CrmPedidoEntity): CrmTaskDraft[] {
  const items = parsePedidoItens(pedido.itens);

  return items.map((item, index) => ({
    crmPedidoId: pedido.id,
    crmItemKey: buildCrmItemKey(pedido.id, index),
    name: buildTaskNameFromPedidoItem(item, pedido.empresaNome),
    qty: item.qty,
    deliveryDate: pedido.dataEntrega ?? null,
    templateTaskCode: String(item.prodId),
    prodId: item.prodId,
  }));
}
