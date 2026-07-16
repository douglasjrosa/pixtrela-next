/**
 * Card/modal display title: quantity prefix + stored task name.
 * Stored name is "Empresa - Nome da caixa" (no qty).
 */
export function formatTaskDisplayTitle(qty: number, name: string): string {
  return `${qty} - ${name}`;
}
