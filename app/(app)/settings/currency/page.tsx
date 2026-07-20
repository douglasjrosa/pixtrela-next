import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  CurrencyForm,
} from "@/components/settings/currency-form";
import {
  CurrencyManager,
  type CurrencyRow,
} from "@/components/settings/currency-manager";
import { loadCurrencyForSubtasks } from "@/lib/strapi/currency-for-subtasks";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { updateCurrencyForSubtasks } from "../actions";
import {
  createCurrency,
  deleteCurrency,
  updateCurrency,
  uploadCurrencyIcon,
} from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface CurrencyEntity {
  documentId: string;
  name: string;
  title?: string | null;
  pluralTitle?: string | null;
  currencyPerSecond: number;
  iconMedia?: { id?: number; url?: string | null } | null;
}

async function loadCurrencies(): Promise<CurrencyRow[]> {
  try {
    const res = await strapiFetch<StrapiList<CurrencyEntity>>(
      "/currencies",
      { strapiCache: { tags: [STRAPI_TAGS.currencies], revalidate: 60 } },
      {
        fields: [
          "documentId",
          "name",
          "title",
          "pluralTitle",
          "currencyPerSecond",
        ],
        populate: {
          iconMedia: {
            fields: ["id", "url"],
          },
        },
        sort: ["name:asc"],
        pagination: { pageSize: 100 },
      },
    );

    return res.data.map((currency) => ({
      documentId: currency.documentId,
      name: currency.name,
      title: currency.title ?? "",
      pluralTitle: currency.pluralTitle ?? "",
      iconMediaId: currency.iconMedia?.id ?? null,
      iconMediaUrl: resolveStrapiMediaUrl(currency.iconMedia?.url ?? null),
      currencyPerSecond: Number(currency.currencyPerSecond ?? 0),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function SettingsCurrencyPage() {
  const [currencies, activeCurrency] = await Promise.all([
    loadCurrencies(),
    loadCurrencyForSubtasks(),
  ]);

  return (
    <div className="space-y-10">
      <CurrencyManager
        currencies={currencies}
        onCreate={createCurrency}
        onUpdate={updateCurrency}
        onDelete={deleteCurrency}
        onUploadIcon={uploadCurrencyIcon}
      />
      <CurrencyForm
        currencies={currencies}
        activeCurrencyDocumentId={activeCurrency.currencyDocumentId}
        onSave={updateCurrencyForSubtasks}
      />
    </div>
  );
}
