export const DEFAULT_DECIMAL_PLACES = 2;

/** Decimal places implied by an HTML number input `step`. */
export function decimalPlacesFromStep(
  step: number | string | undefined,
): number {
  if (step === undefined || step === "" || step === "any") {
    return DEFAULT_DECIMAL_PLACES;
  }

  if (typeof step === "string") {
    const trimmed = step.trim();
    const scientific = trimmed.match(/e-(\d+)$/i);
    if (scientific?.[1]) return Number(scientific[1]);
    const dot = trimmed.indexOf(".");
    if (dot >= 0) return trimmed.slice(dot + 1).length;
  }

  const parsed = Number(step);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DECIMAL_PLACES;
  if (Number.isInteger(parsed)) return 0;

  const text = parsed.toString();
  const exponent = text.match(/e-(\d+)/i);
  if (exponent?.[1]) return Number(exponent[1]);
  return text.split(".")[1]?.length ?? DEFAULT_DECIMAL_PLACES;
}

export function roundDecimal(
  value: number,
  places = DEFAULT_DECIMAL_PLACES,
): number {
  if (!Number.isFinite(value)) return 0;
  if (places <= 0) return Math.round(value);
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function formatSteppedNumber(value: number, places: number): string {
  const rounded = roundDecimal(value, places);
  if (places <= 0) return String(rounded);
  return rounded.toFixed(places);
}

export function formatDecimalPtBr(
  value: number,
  places = DEFAULT_DECIMAL_PLACES,
): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(roundDecimal(value, places));
}

/** pt-BR decimal without trailing ,00 (e.g. 14 → "14", 1.66 → "1,66"). */
export function formatCompactDecimalPtBr(value: number): string {
  const rounded = roundDecimal(value, DEFAULT_DECIMAL_PLACES);
  if (Number.isInteger(rounded)) {
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 0,
    }).format(rounded);
  }
  return formatDecimalPtBr(rounded, DEFAULT_DECIMAL_PLACES);
}
