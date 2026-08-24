/**
 * Generic work imported from an external system (ERP, CRM, etc.).
 * Plugins map vendor payloads onto this shape; the core persists tasks.
 */
export type ExternalTaskDraft = {
  name: string;
  qty: number;
  deliveryDate: string | null;
  templateCode: string;
  /** Stable unique key for idempotent upsert (e.g. pedidoId:itemIndex). */
  externalKey: string;
  /** Optional grouping id from the source system (e.g. pedido id). */
  externalGroupId: string | null;
};
