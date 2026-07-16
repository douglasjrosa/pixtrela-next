import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { CurrencyForSubtasksInput } from "@/lib/schemas/currency-for-subtasks";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

/** Strapi 5 single-type REST path (singular API id, no documentId). */
export const CURRENCY_FOR_SUBTASKS_API_PATH = "/currency-for-subtasks";

interface CurrencyEntity {
  documentId: string;
}

interface CurrencyForSubtasksEntity {
  currency?: CurrencyEntity | null;
}

interface StrapiSingle<T> {
  data: T | null;
}

const EMPTY_SETTING: CurrencyForSubtasksInput = {
  currencyDocumentId: "",
};

export async function loadCurrencyForSubtasks(): Promise<CurrencyForSubtasksInput> {
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
          currency: { fields: ["documentId"] },
        },
      },
    );

    return {
      currencyDocumentId: res.data?.currency?.documentId ?? "",
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
