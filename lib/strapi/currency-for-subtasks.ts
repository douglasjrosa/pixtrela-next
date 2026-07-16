import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { CurrencyForSubtasksInput } from "@/lib/schemas/currency-for-subtasks";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

/** Strapi 5 single-type REST path (singular API id, no documentId). */
export const CURRENCY_FOR_SUBTASKS_API_PATH = "/currency-for-subtasks";

interface CurrencyEntity {
  documentId: string;
  name?: string;
  title?: string;
  pluralTitle?: string;
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
};

const EMPTY_SETTING: CurrencyForSubtasksSetting = {
  currencyDocumentId: "",
  currencyName: "",
  currencyTitle: "",
  currencyPluralTitle: "",
};

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
            fields: ["documentId", "name", "title", "pluralTitle"],
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
