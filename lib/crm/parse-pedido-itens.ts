export interface CrmPedidoItem {
  qty: number;
  prodId: number;
  nomeProd: string;
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function toNonEmptyString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

function normalizeRawItem(raw: unknown): CrmPedidoItem | null {
  if (typeof raw !== "object" || raw === null) return null;

  const record = raw as Record<string, unknown>;
  const prodId = toPositiveInt(record.prodId);
  if (prodId == null) return null;

  const qty = toPositiveInt(record.Qtd) ?? 1;
  const nomeProd = toNonEmptyString(record.nomeProd);
  if (!nomeProd) return null;

  return { qty, prodId, nomeProd };
}

/**
 * Parses CRM pedido `itens` JSON (array or stringified array).
 */
export function parsePedidoItens(itens: unknown): CrmPedidoItem[] {
  if (itens == null) return [];

  let rows: unknown[] = [];
  if (Array.isArray(itens)) {
    rows = itens;
  } else if (typeof itens === "string") {
    const trimmed = itens.trim();
    if (!trimmed || trimmed === "null") return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
      return [];
    }
  }

  return rows
    .map((row) => normalizeRawItem(row))
    .filter((item): item is CrmPedidoItem => item !== null);
}
