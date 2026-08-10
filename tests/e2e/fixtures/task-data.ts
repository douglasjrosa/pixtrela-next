/** Formats a local calendar date as YYYY-MM-DD. */
function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formats a local calendar date as DD/MM/YYYY (pt-BR list display). */
function formatDatePtBr(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Task payload for create-task E2E.
 * deliveryDate stays inside the default list lookback window (today − 30d).
 */
function buildCreateTaskE2ePayload(now: Date = new Date()) {
  const delivery = new Date(now.getTime());
  delivery.setHours(0, 0, 0, 0);

  return {
    name: "15 - Max Brasil - Caixotona",
    qty: "15",
    deliveryDate: formatDateOnly(delivery),
    deliveryDatePtBr: formatDatePtBr(delivery),
    /** UI label for status `waiting` (pt-BR). */
    statusLabel: "Aguardando",
    /** Matches step "Na Fila" or seed default "Fila de produção". */
    stepLabelPattern: /fila/i,
    templateTaskCode: "123",
  } as const;
}

export const createTaskE2ePayload = buildCreateTaskE2ePayload();

export const stepLabelPattern = createTaskE2ePayload.stepLabelPattern;
