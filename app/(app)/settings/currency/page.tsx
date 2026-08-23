import {
  CurrencyForm,
} from "@/components/settings/currency-form";
import {
  CurrencyManager,
  type CurrencyRow,
} from "@/components/settings/currency-manager";
import { primaryCurrencyDocumentId } from "@/lib/business/primary-currency";
import { listCurrencies as listCurrenciesRepo } from "@/lib/repos/awards";
import { loadCurrencyForSubtasks } from "@/lib/settings/load-currency-for-subtasks";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

import { updateCurrencyForSubtasks } from "../actions";
import {
  createCurrency,
  deleteCurrency,
  updateCurrency,
  uploadCurrencyIcon,
} from "./actions";

async function loadCurrencies(): Promise<CurrencyRow[]> {
  const rows = await listCurrenciesRepo();
  return rows.map((currency) => ({
    documentId: currency.id,
    name: currency.name,
    title: currency.title ?? "",
    pluralTitle: currency.pluralTitle ?? "",
    iconMediaId: currency.iconMediaId,
    iconMediaUrl: toBrowserMediaUrl(currency.iconMediaUrl),
    currencyPerSecond: Number(currency.currencyPerSecond ?? 0),
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
        onCreate={createCurrency}
        onUpdate={updateCurrency}
        onDelete={deleteCurrency}
        onUploadIcon={uploadCurrencyIcon}
      />
      <CurrencyForm
        currencies={currencies}
        activeCurrencyDocumentId={
          activeCurrencyDocumentId || primaryCurrencyDocumentId(currencies) || ""
        }
        onSave={updateCurrencyForSubtasks}
      />
    </div>
  );
}
