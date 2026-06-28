/** Task payload for create-task E2E (deliveryDate uses HTML date input format). */
export const createTaskE2ePayload = {
  name: "15 - Max Brasil - Caixotona",
  qty: "15",
  deliveryDate: "2026-06-28",
  deliveryDatePtBr: "28/06/2026",
  /** UI label for status `queued` (pt-BR). */
  statusLabel: "Na fila",
  /** Matches step "Na Fila" or seed default "Fila de produção". */
  stepLabelPattern: /fila/i,
  templateTaskCode: "123",
} as const;

export const stepLabelPattern = createTaskE2ePayload.stepLabelPattern;
