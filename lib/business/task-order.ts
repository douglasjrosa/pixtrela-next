export function getNextTaskIndex(items: { index: number }[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.index)) + 1;
}
