export function formatExchangeCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatExchangeCurrencyLabel(
  amount: number,
  currencyPluralTitle: string,
): string {
  return `${formatExchangeCurrencyAmount(amount)} ${currencyPluralTitle}`;
}
