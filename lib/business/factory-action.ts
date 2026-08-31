export const FACTORY_ACTION_MIN_QUERY_LENGTH = 3;

export interface FactoryAction {
  documentId: string;
  name: string;
  unitTime: number;
  description: string;
  qtyQuestion: string;
  active: boolean;
}

export function shouldSearchFactoryActions(query: string): boolean {
  return query.trim().length >= FACTORY_ACTION_MIN_QUERY_LENGTH;
}

export function parseActionUnitTime(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
