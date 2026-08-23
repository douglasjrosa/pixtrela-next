import type { CurrencyForSubtasksInput } from "@/lib/schemas/currency-for-subtasks";
import { roundCurrencyRate } from "@/lib/format/currency-rate";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export type CurrencyForSubtasksSetting = {
  currencyDocumentId: string;
  currencyName: string;
  currencyTitle: string;
  currencyPluralTitle: string;
  currencyIconUrl: string | null;
  currencyPerSecond: number;
};

/** Slim payload for board / UI payment display (JSON-serializable). */
export type SubtaskPaymentCurrency = {
  iconUrl: string | null;
  currencyPerSecond: number;
  pluralTitle: string;
};

const EMPTY_SETTING: CurrencyForSubtasksSetting = {
  currencyDocumentId: "",
  currencyName: "",
  currencyTitle: "",
  currencyPluralTitle: "",
  currencyIconUrl: null,
  currencyPerSecond: 0,
};

export function toSubtaskPaymentCurrency(
  setting: CurrencyForSubtasksSetting,
): SubtaskPaymentCurrency {
  return {
    iconUrl: setting.currencyIconUrl,
    currencyPerSecond: setting.currencyPerSecond,
    pluralTitle: setting.currencyPluralTitle || setting.currencyTitle,
  };
}

export async function loadCurrencyForSubtasks(): Promise<CurrencyForSubtasksSetting> {
  const row = await getCurrencyForSubtasks();
  if (!row) return EMPTY_SETTING;

  return {
    currencyDocumentId: row.currencyId,
    currencyName: row.currencyName ?? "",
    currencyTitle: row.currencyTitle ?? "",
    currencyPluralTitle: row.currencyPluralTitle ?? "",
    currencyIconUrl: toBrowserMediaUrl(row.iconMediaUrl),
    currencyPerSecond: roundCurrencyRate(Number(row.currencyPerSecond ?? 0)),
  };
}

export function toCurrencyForSubtasksPayload(
  values: CurrencyForSubtasksInput,
): Record<string, string | null> {
  return {
    currency: values.currencyDocumentId || null,
  };
}
