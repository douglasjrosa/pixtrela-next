import {
  CurrencyForm,
  type CurrencyRate,
} from "@/components/settings/currency-form";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { updateCurrencyRates } from "../actions";

interface StrapiList<T> {
  data: T[];
}

interface CurrencyEntity {
  documentId: string;
  name: string;
  title?: string | null;
  pluralTitle?: string | null;
  currencyPerSecond: number;
}

async function loadCurrencies(): Promise<CurrencyRate[]> {
  try {
    const res = await strapiFetch<StrapiList<CurrencyEntity>>(
      "/currencies",
      { strapiCache: { tags: [STRAPI_TAGS.currencies], revalidate: 60 } },
      {
        fields: ["documentId", "name", "title", "pluralTitle", "currencyPerSecond"],
        sort: ["name:asc"],
        pagination: { pageSize: 100 },
      },
    );

    return res.data.map((currency) => ({
      documentId: currency.documentId,
      title: currency.title ?? "",
      pluralTitle: currency.pluralTitle ?? "",
      currencyPerSecond: Number(currency.currencyPerSecond ?? 0),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function SettingsCurrencyPage() {
  const currencies = await loadCurrencies();

  async function handleSaveCurrency(values: {
    rates: { documentId: string; currencyPerSecond: number }[];
  }): Promise<void> {
    "use server";
    await updateCurrencyRates(values.rates);
  }

  return <CurrencyForm currencies={currencies} onSave={handleSaveCurrency} />;
}
