export type CurrencyLabelSource = {
  pluralTitle?: string | null;
  title?: string | null;
  name: string;
};

export type AwardLabelSource = {
  title?: string | null;
  name: string;
};

/** Stable plural label stored on balance and exchange history rows. */
export function resolveCurrencyPluralTitle(
  currency: CurrencyLabelSource,
): string {
  const plural = currency.pluralTitle?.trim();
  if (plural) return plural;
  const title = currency.title?.trim();
  if (title) return title;
  return currency.name.trim();
}

/** Stable award label stored on exchange history rows. */
export function resolveAwardHistoryTitle(award: AwardLabelSource): string {
  const title = award.title?.trim();
  if (title) return title;
  return award.name.trim();
}
