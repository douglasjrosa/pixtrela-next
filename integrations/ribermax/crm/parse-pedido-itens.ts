export interface CrmPedidoItem {
  qty: number;
  prodId: number;
  nomeProd: string;
  versions: string[];
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

/**
 * Normalizes CRM `versions` to a chronological list of product id strings.
 */
export function normalizeProdutoVersions(value: unknown): string[] {
  let rows: unknown[] = [];
  if (Array.isArray(value)) {
    rows = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null") return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
      return [];
    }
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of rows) {
    if (typeof entry !== "string" && typeof entry !== "number") continue;
    const code = String(entry).trim();
    if (!code || !/^\d+$/.test(code) || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

function normalizeRawItem(raw: unknown): CrmPedidoItem | null {
  if (typeof raw !== "object" || raw === null) return null;

  const record = raw as Record<string, unknown>;
  const prodId = toPositiveInt(record.prodId);
  if (prodId == null) return null;

  const qty = toPositiveInt(record.Qtd) ?? 1;
  const nomeProd =
    toNonEmptyString(record.nomeProd) || toNonEmptyString(record.titulo);
  if (!nomeProd) return null;

  return {
    qty,
    prodId,
    nomeProd,
    versions: normalizeProdutoVersions(record.versions),
  };
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
