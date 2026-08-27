export function calculateSubTaskDisplayQty(subTaskQty: number): number {
  return Math.max(1, Math.floor(Number(subTaskQty) || 0) || 1);
}
