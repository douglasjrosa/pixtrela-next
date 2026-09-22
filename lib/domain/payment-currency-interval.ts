export type PaymentCurrencyInterval = {
  currencyId: string;
  validFrom: Date;
  validUntil: Date | null;
};

/** Half-open interval [validFrom, validUntil). */
export function paymentIntervalContains(
  interval: PaymentCurrencyInterval,
  at: Date,
): boolean {
  const time = at.getTime();
  if (time < interval.validFrom.getTime()) return false;
  if (interval.validUntil && time >= interval.validUntil.getTime()) {
    return false;
  }
  return true;
}

export function findPaymentIntervalAt(
  intervals: readonly PaymentCurrencyInterval[],
  at: Date,
): PaymentCurrencyInterval | null {
  return intervals.find((interval) => paymentIntervalContains(interval, at))
    ?? null;
}
