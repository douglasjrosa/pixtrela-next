import {
  CurrencyForm,
} from "@/components/settings/currency-form";
import {
  CurrencyManager,
  type CurrencyRow,
} from "@/components/settings/currency-manager";
import { primaryCurrencyDocumentId } from "@/lib/business/primary-currency";
import { roundCurrencyRate } from "@/lib/format/currency-rate";
import { listCurrencies as listCurrenciesRepo } from "@/lib/repos/awards";
import { loadCurrencyForSubtasks } from "@/lib/settings/load-currency-for-subtasks";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

import { updateCurrencyForSubtasks } from "../actions";
import {
  bulkArchiveCurrencies,
  bulkDeleteCurrencies,
  createCurrency,
  deleteCurrency,
  listCurrencyImages,
  updateCurrency,
  uploadCurrencyIcon,
} from "./actions";

export const dynamic = "force-dynamic";

async function loadCurrencies(): Promise<CurrencyRow[]> {
  const rows = await listCurrenciesRepo({ includeInactive: true });
  return rows.map((currency) => ({
    documentId: currency.id,
    name: currency.name,
    title: currency.title ?? "",
    pluralTitle: currency.pluralTitle ?? "",
    iconMediaId: currency.iconMediaId,
    iconMediaUrl: toBrowserMediaUrl(currency.iconMediaUrl),
    currencyPerSecond: roundCurrencyRate(Number(currency.currencyPerSecond ?? 0)),
    exchangeRate: Number(currency.exchangeRate ?? 0),
    active: currency.active,
    showInStore: currency.showInStore,
  }));
}

async function loadActiveCurrencyDocumentId(): Promise<string> {
  const active = await loadCurrencyForSubtasks();
  return active.currencyDocumentId;
}

export default async function SettingsCurrencyPage() {
  const [currencies, activeCurrencyDocumentId] = await Promise.all([
    loadCurrencies(),
    loadActiveCurrencyDocumentId(),
  ]);

  return (
    <div className="space-y-10">
      <CurrencyManager
        currencies={currencies}
        protectedCurrencyId={
          activeCurrencyDocumentId || primaryCurrencyDocumentId(currencies)
        }
        onCreate={createCurrency}
        onUpdate={updateCurrency}
        onDelete={deleteCurrency}
        onBulkArchive={bulkArchiveCurrencies}
        onBulkDelete={bulkDeleteCurrencies}
        onListImages={listCurrencyImages}
        onUploadImage={uploadCurrencyIcon}
      />
      <CurrencyForm
        currencies={currencies.filter((currency) => currency.active)}
        activeCurrencyDocumentId={activeCurrencyDocumentId}
        action={updateCurrencyForSubtasks}
      />
    </div>
  );
}
