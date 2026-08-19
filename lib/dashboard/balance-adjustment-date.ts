const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const BALANCE_ADJUSTMENT_MAX_AGE_DAYS = 30;

export function formatIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBalanceAdjustmentDateBounds(now = new Date()): {
  min: string;
  max: string;
} {
  const max = formatIsoDateLocal(now);
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() - BALANCE_ADJUSTMENT_MAX_AGE_DAYS);
  return {
    min: formatIsoDateLocal(minDate),
    max,
  };
}

export function isBalanceAdjustmentDateInRange(
  value: string,
  now = new Date(),
): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const { min, max } = getBalanceAdjustmentDateBounds(now);
  return value >= min && value <= max;
}
