/** Monthly balance fields shown on the colaborator private home. */
export interface CurrencyBalanceProps {
  balance: number;
  previousBalance: number;
  totalIncome: number;
  totalOutcome: number;
  /** Display name of the currency unit (e.g. Estrelas). */
  currencyLabel?: string;
}
