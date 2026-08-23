export function formatExchangeCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(amount);
}

export type ExchangeCurrencyLabels = {
  title: string;
  pluralTitle: string;
};

export function exchangeCurrencyLabelForAmount(
  amount: number,
  labels: ExchangeCurrencyLabels,
): string {
  return amount === 1 ? labels.title : labels.pluralTitle;
}

export function formatExchangeCurrencyLabel(
  amount: number,
  labels: ExchangeCurrencyLabels,
): string {
  return `${formatExchangeCurrencyAmount(amount)} ${exchangeCurrencyLabelForAmount(amount, labels)}`;
}
