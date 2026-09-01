const CRM_ITEM_KEY_SEPARATOR = ":";
const CRM_ITEM_KEY_DISPLAY_SEPARATOR = "-";
const CRM_ITEM_KEY_PATTERN = /^(\d+):(\d+)$/;

export type ParsedCrmItemKey = {
  pedidoId: number;
  itemIndex: number;
};

/** Display label for tasks.crm_item_key (e.g. 4864:0 → 4864-0). */
export function formatCrmItemKeyLabel(key: string | null | undefined): string {
  if (!key) return "";
  return key.replaceAll(CRM_ITEM_KEY_SEPARATOR, CRM_ITEM_KEY_DISPLAY_SEPARATOR);
}

export function parseCrmItemKey(key: string): ParsedCrmItemKey | null {
  const match = CRM_ITEM_KEY_PATTERN.exec(key.trim());
  if (!match) return null;
  return {
    pedidoId: Number(match[1]),
    itemIndex: Number(match[2]),
  };
}

export function compareCrmItemKeys(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const leftParsed = parseCrmItemKey(left);
  const rightParsed = parseCrmItemKey(right);
  if (!leftParsed && !rightParsed) {
    return left.localeCompare(right, "pt-BR", { sensitivity: "base" });
  }
  if (!leftParsed) return 1;
  if (!rightParsed) return -1;

  const pedidoDiff = leftParsed.pedidoId - rightParsed.pedidoId;
  if (pedidoDiff !== 0) return pedidoDiff;
  return leftParsed.itemIndex - rightParsed.itemIndex;
}
