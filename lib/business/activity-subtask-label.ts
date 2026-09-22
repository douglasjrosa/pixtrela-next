import { formatCrmItemKeyLabel } from "@/lib/format/format-crm-item-key";
import { formatDatePtBr } from "@/lib/format/datetime";

export type ActivitySubtaskLabelParts = {
  subTaskName: string;
  taskQty: number;
  taskName: string;
  taskCrmItemKey?: string | null;
  taskDeliveryDate?: string | null;
};

const LABEL_SEGMENT_SEPARATOR = " - ";

function normalizeSearchToken(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

/** Full subtask label for activities list and picker (pt-BR segments). */
export function formatActivitySubtaskDisplayLabel(
  parts: ActivitySubtaskLabelParts,
): string {
  const pedidoItem = formatCrmItemKeyLabel(parts.taskCrmItemKey) || "—";
  const delivery = formatDatePtBr(parts.taskDeliveryDate);
  return [
    parts.subTaskName.trim(),
    String(parts.taskQty),
    parts.taskName.trim(),
    pedidoItem,
    delivery,
  ].join(LABEL_SEGMENT_SEPARATOR);
}

export function activitySubtaskSearchHaystack(
  parts: ActivitySubtaskLabelParts,
): string {
  const pedidoItem = formatCrmItemKeyLabel(parts.taskCrmItemKey);
  return [
    parts.subTaskName,
    String(parts.taskQty),
    parts.taskName,
    parts.taskCrmItemKey ?? "",
    pedidoItem,
    formatDatePtBr(parts.taskDeliveryDate),
    formatActivitySubtaskDisplayLabel(parts),
  ]
    .map(normalizeSearchToken)
    .join(" ");
}

export function activitySubtaskMatchesQuery(
  parts: ActivitySubtaskLabelParts,
  query: string,
): boolean {
  const token = normalizeSearchToken(query);
  if (!token) return true;
  return activitySubtaskSearchHaystack(parts).includes(token);
}
