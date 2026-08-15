/** Slim payload for board / UI payment display (JSON-serializable). */
export type SubtaskPaymentCurrency = {
  iconUrl: string | null;
  currencyPerSecond: number;
  pluralTitle: string;
};
