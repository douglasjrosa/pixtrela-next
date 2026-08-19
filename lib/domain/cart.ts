/**
 * Pure shopping-cart rules for award exchanges.
 */

export function clampCartQty(qty: number, stock: number): number {
  const safeQty = Math.max(1, Math.floor(qty));
  if (stock <= 0) return 0;
  return Math.min(safeQty, stock);
}

export function cartLineCost(unitCost: number, qty: number): number {
  if (unitCost <= 0 || qty <= 0) return 0;
  return unitCost * qty;
}

export function cartTotal(
  lines: ReadonlyArray<{ unitCost: number; qty: number }>,
): number {
  return lines.reduce(
    (sum, line) => sum + cartLineCost(line.unitCost, line.qty),
    0,
  );
}

export function cartItemCount(
  lines: ReadonlyArray<{ qty: number }>,
): number {
  return lines.reduce((sum, line) => sum + Math.max(0, line.qty), 0);
}

export function canAffordCart(balance: number, total: number): boolean {
  return total > 0 && balance >= total;
}
