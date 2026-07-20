import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { CurrencyForSubtasksInput } from "@/lib/schemas/currency-for-subtasks";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

/** Strapi 5 single-type REST path (singular API id, no documentId). */
export const CURRENCY_FOR_SUBTASKS_API_PATH = "/currency-for-subtasks";

interface CurrencyMediaEntity {
  id?: number;
  url?: string | null;
}

interface CurrencyEntity {
  documentId: string;
  name?: string;
  title?: string;
  pluralTitle?: string;
  currencyPerSecond?: number | null;
  iconMedia?: CurrencyMediaEntity | null;
}

interface CurrencyForSubtasksEntity {
  currency?: CurrencyEntity | null;
}

interface StrapiSingle<T> {
  data: T | null;
}

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
  try {
    const res = await strapiFetch<StrapiSingle<CurrencyForSubtasksEntity>>(
      CURRENCY_FOR_SUBTASKS_API_PATH,
      {
        strapiCache: {
          tags: [STRAPI_TAGS.currencyForSubtasks],
          revalidate: 60,
        },
      },
      {
        populate: {
          currency: {
            fields: [
              "documentId",
              "name",
              "title",
              "pluralTitle",
              "currencyPerSecond",
            ],
            populate: {
              iconMedia: {
                fields: ["url"],
              },
            },
          },
        },
      },
    );

    const currency = res.data?.currency;
    return {
      currencyDocumentId: currency?.documentId ?? "",
      currencyName: currency?.name ?? "",
      currencyTitle: currency?.title ?? "",
      currencyPluralTitle: currency?.pluralTitle ?? "",
      currencyIconUrl: resolveStrapiMediaUrl(currency?.iconMedia?.url ?? null),
      currencyPerSecond: Number(currency?.currencyPerSecond ?? 0),
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return EMPTY_SETTING;
  }
}

export function toCurrencyForSubtasksPayload(
  values: CurrencyForSubtasksInput,
): Record<string, string | null> {
  return {
    currency: values.currencyDocumentId || null,
  };
}
